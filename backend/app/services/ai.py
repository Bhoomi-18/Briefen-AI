import os
import logging
import asyncio
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from faster_whisper import WhisperModel
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Gemini Client if API key is provided
_gemini_client = None

def get_gemini_client() -> Optional[genai.Client]:
    global _gemini_client
    if _gemini_client is None and settings.GEMINI_API_KEY:
        try:
            _gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            logger.info("Google GenAI Client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Google GenAI Client: {str(e)}")
    return _gemini_client

# Whisper Model lazy initialization cache
_whisper_model = None

def get_whisper_model() -> WhisperModel:
    global _whisper_model
    if _whisper_model is None:
        model_size = os.getenv("WHISPER_MODEL_SIZE", "base")
        logger.info(f"Loading local Faster-Whisper model '{model_size}' on CPU...")
        # CPU execution, float32 compute type is chosen for general compatibility
        _whisper_model = WhisperModel(model_size, device="cpu", compute_type="float32")
        logger.info("Faster-Whisper model loaded successfully.")
    return _whisper_model


async def transcribe_audio(file_path: str) -> str:
    """Send audio/video file to local Faster-Whisper model for speech-to-text transcription."""
    if not os.path.exists(file_path):
        logger.error(f"Audio file path does not exist for transcription: {file_path}")
        return "[Error: Audio file not found]"

    try:
        loop = asyncio.get_event_loop()
        
        def run_transcription():
            model = get_whisper_model()
            logger.info(f"Running local Whisper transcribe on: {file_path}")
            segments, info = model.transcribe(file_path, beam_size=5)
            text_segments = []
            for segment in segments:
                text_segments.append(segment.text)
            return " ".join(text_segments).strip()
            
        transcript_text = await loop.run_in_executor(None, run_transcription)
        return transcript_text
    except Exception as e:
        logger.error(f"Faster-Whisper transcription failed: {str(e)}", exc_info=True)
        return f"[Failed to transcribe audio automatically. Error: {str(e)}]"


async def generate_summary_metadata(transcript: str) -> Dict[str, Any]:
    """Execute Gemini call to extract meeting summary, key decisions, action items, and keywords."""
    client = get_gemini_client()
    if not client:
        logger.warning("Gemini API key missing. Summary extraction returning configurations reminder.")
        return {
            "summary": "Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables to enable AI summary generation.",
            "keywords": ["Missing API Key"],
            "action_items": [],
            "decisions": []
        }

    try:
        prompt = (
            "You are a Meeting Intelligence assistant. Analyze this meeting transcript and extract "
            "exactly: a brief summary paragraph, a list of keywords (maximum 6), a list of action items "
            "with clear assignee names (can be null if not clear), and a list of decisions made.\n\n"
            "Return a JSON object with the following fields:\n"
            "{\n"
            '  "summary": "string",\n'
            '  "keywords": ["string"],\n'
            '  "action_items": [{"content": "string", "assignee": "string"}],\n'
            '  "decisions": ["string"]\n'
            "}\n\n"
            f"Transcript:\n{transcript}"
        )
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
        )
        import json
        data = json.loads(response.text)
        return {
            "summary": data.get("summary", ""),
            "keywords": data.get("keywords", []),
            "action_items": data.get("action_items", []),
            "decisions": data.get("decisions", [])
        }
    except Exception as e:
        logger.error(f"Gemini summary generation failed: {str(e)}", exc_info=True)
        return {
            "summary": f"Failed to extract summary automatically. Error: {str(e)}",
            "keywords": ["Failed"],
            "action_items": [],
            "decisions": []
        }


async def generate_embedding(text: str) -> List[float]:
    """Compute 768-dimensional Gemini vector embedding for a segment of text using text-embedding-004."""
    client = get_gemini_client()
    if not client:
        # Fallback consistent random vector of length 768
        import random
        random.seed(hash(text))
        vector = [random.uniform(-1.0, 1.0) for _ in range(768)]
        magnitude = sum(x*x for x in vector) ** 0.5
        return [x / magnitude for x in vector]

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: client.models.embed_content(
                model="gemini-embedding-001",
                contents=text,
                config=types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT"
                )
            )
        )
        return result.embeddings[0].values
    except Exception as e:
        logger.error(f"Gemini embedding generation failed: {str(e)}", exc_info=True)
        import random
        return [random.random() for _ in range(768)]


async def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """Compute embeddings batch for a list of segments."""
    return [await generate_embedding(t) for t in texts]


async def generate_chat_response(question: str, transcript_segments: List[str]) -> str:
    """Generate an answer to a user's question using Gemini model, fed with semantic context segments."""
    client = get_gemini_client()
    if not client:
        citations_str = "\n".join([f"- {seg.strip()}" for seg in transcript_segments])
        return (
            "Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables to enable AI Chat.\n\n"
            f"Retrieved segments from database:\n{citations_str}"
        )

    try:
        context = "\n".join(transcript_segments)
        prompt = (
            "You are Briefen AI, the intelligent knowledge operating system for projects. "
            "Your goal is to answer the user's questions based on the provided project memory context, "
            "including transcripts, task logs, architectural decisions, and timelines. "
            "Answer as best as possible using the retrieved context segments. "
            "Cite specific statements or decisions where appropriate.\n\n"
            f"Retrieved Project Memory Context:\n{context}\n\n"
            f"Question: {question}"
        )
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
        )
        return response.text
    except Exception as e:
        logger.error(f"Gemini chat response failed: {str(e)}", exc_info=True)
        return f"Failed to generate AI Chat answer. Error details: {str(e)}"
