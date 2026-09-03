"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Shield,
  Bell,
  Cpu,
  Save,
  Trash2,
  Check,
  User as UserIcon,
  Lock,
  Sun,
  Moon,
  Copy,
  Plus
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/providers/toast-provider"
import { useAuth } from "@/lib/hooks"

export default function SettingsPage() {
  const { toast } = useToast()
  const {
    user,
    updateProfile,
    isUpdatingProfile,
    updateSettings,
    updatePassword,
    isUpdatingPassword,
    deleteAccount,
    isDeletingAccount,
    uploadAvatar,
    isUploadingAvatar
  } = useAuth()

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("")

  const [activeTab, setActiveTab] = React.useState<"profile" | "security" | "appearance" | "notifications" | "api">("profile")

  // Personal Settings States
  const [fullName, setFullName] = React.useState(user?.profile?.full_name || "")
  const [email, setEmail] = React.useState(user?.email || "")

  // Password Update States
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")

  const [twoFactor, setTwoFactor] = React.useState(false)
  const [themeMode, setThemeMode] = React.useState<"light" | "dark" | "system">("dark")
  
  // Notification states
  const [emailDigests, setEmailDigests] = React.useState(true)
  const [aiHighlights, setAiHighlights] = React.useState(true)
  const [transcriptionAlerts, setTranscriptionAlerts] = React.useState(true)

  // API states
  const [apiKeys, setApiKeys] = React.useState<{ name: string; key: string; created: string }[]>([
    { name: "Personal CLI Key", key: "mm_live_72k19dh2j1h8sa872j", created: "Aug 02, 2026" }
  ])
  const [newKeyName, setNewKeyName] = React.useState("")

  // Keep local states synced with user data
  React.useEffect(() => {
    if (user) {
      setFullName(user.profile?.full_name || "")
      setEmail(user.email || "")
      setThemeMode((user.settings?.theme_mode as any) || "dark")
      setEmailDigests(user.settings?.email_digests ?? true)
      setAiHighlights(user.settings?.ai_highlights ?? true)
      setTranscriptionAlerts(user.settings?.transcription_alerts ?? true)
    }
  }, [user])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile({ full_name: fullName })
      toast({
        title: "Profile Saved",
        description: "Your full name preferences updated successfully.",
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Failed to update profile details.",
        variant: "error",
      })
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Avatar images must be smaller than 5MB.",
        variant: "error",
      })
      return
    }

    try {
      await uploadAvatar(file)
      toast({
        title: "Avatar Uploaded",
        description: "Your profile picture has been updated successfully.",
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload avatar image file.",
        variant: "error",
      })
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete my account") {
      toast({
        title: "Confirmation Error",
        description: "Please type 'delete my account' exactly to confirm deletion.",
        variant: "error",
      })
      return
    }

    try {
      await deleteAccount()
      toast({
        title: "Account Deleted",
        description: "Your account credentials and sandbox records have been deleted.",
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete account.",
        variant: "error",
      })
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({
        title: "Mismatch Error",
        description: "New passwords do not match.",
        variant: "error",
      })
      return
    }

    try {
      await updatePassword({ current_password: currentPassword, new_password: newPassword })
      toast({
        title: "Password Updated",
        description: "Your account credentials have been changed successfully.",
        variant: "success",
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to change credentials. Verify your current password.",
        variant: "error",
      })
    }
  }

  const toggleEmailDigest = async () => {
    const nextVal = !emailDigests
    setEmailDigests(nextVal)
    try {
      await updateSettings({ email_digests: nextVal })
      toast({
        title: "Preferences Saved",
        description: `Weekly summaries Digests alerts ${nextVal ? "enabled" : "disabled"}.`,
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Failed to save settings",
        description: err.message,
        variant: "error",
      })
    }
  }

  const toggleAiHighlights = async () => {
    const nextVal = !aiHighlights
    setAiHighlights(nextVal)
    try {
      await updateSettings({ ai_highlights: nextVal })
      toast({
        title: "Preferences Saved",
        description: `AI Action highlights Digests alerts ${nextVal ? "enabled" : "disabled"}.`,
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Failed to save settings",
        description: err.message,
        variant: "error",
      })
    }
  }

  const toggleTranscriptionAlerts = async () => {
    const nextVal = !transcriptionAlerts
    setTranscriptionAlerts(nextVal)
    try {
      await updateSettings({ transcription_alerts: nextVal })
      toast({
        title: "Preferences Saved",
        description: `Transcription sync completions push ${nextVal ? "enabled" : "disabled"}.`,
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Failed to save settings",
        description: err.message,
        variant: "error",
      })
    }
  }

  const changeTheme = async (mode: "light" | "dark" | "system") => {
    setThemeMode(mode)
    
    // Sync browser HTML classes
    if (mode === "dark") {
      document.documentElement.classList.add("dark")
    } else if (mode === "light") {
      document.documentElement.classList.remove("dark")
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (systemDark) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }

    try {
      await updateSettings({ theme_mode: mode })
      toast({
        title: "Theme Updated",
        description: `Workspace theme mode changed to ${mode}.`,
        variant: "success",
      })
    } catch (err: any) {
      toast({
        title: "Failed to save theme settings",
        description: err.message,
        variant: "error",
      })
    }
  }

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return
    const randomKey = `mm_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`
    setApiKeys((prev) => [
      ...prev,
      { name: newKeyName, key: randomKey, created: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) }
    ])
    setNewKeyName("")
    toast({
      title: "API Key Generated",
      description: "Make sure to copy your new secret token.",
      variant: "success",
    })
  }

  const handleDeleteKey = (keyToDelete: string) => {
    setApiKeys((prev) => prev.filter((k) => k.key !== keyToDelete))
    toast({
      title: "API Key Revoked",
      description: "The token has been deleted.",
      variant: "error",
    })
  }

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({
      title: "Copied Token",
      description: "Secret API token copied to clipboard.",
      variant: "success",
    })
  }

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="border-b border-border/40 pb-6">
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground/90">
          Account Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your personal profile, security options, theme preferences, and access tokens.
        </p>
      </div>

      {/* Settings layout split pane */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation list */}
        <nav role="tablist" aria-label="Settings sections" className="md:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab("profile")}
            role="tab"
            aria-selected={activeTab === "profile"}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "profile" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile Settings</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            role="tab"
            aria-selected={activeTab === "security"}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "security" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security & 2FA</span>
          </button>
          <button
            onClick={() => setActiveTab("appearance")}
            role="tab"
            aria-selected={activeTab === "appearance"}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "appearance" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Appearance</span>
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            role="tab"
            aria-selected={activeTab === "notifications"}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "notifications" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>
          <button
            onClick={() => setActiveTab("api")}
            role="tab"
            aria-selected={activeTab === "api"}
            className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "api" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Developer API Keys</span>
          </button>
        </nav>

        {/* Form details */}
        <div className="md:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Personal Profile Settings</CardTitle>
                    <CardDescription>Adjust your name and account credentials.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSave} className="space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border/40 mb-6">
                        <div className="relative group w-20 h-20 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
                          {user?.avatar || user?.profile?.avatar_url ? (
                            <img
                              src={user.avatar || user.profile.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-8 h-8 text-muted-foreground" />
                          )}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white cursor-pointer transition-opacity font-semibold">
                            <span>Change</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                              disabled={isUploadingAvatar}
                            />
                          </label>
                          {isUploadingAvatar && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-1.5 text-center sm:text-left">
                          <h3 className="text-sm font-semibold text-foreground/90">Profile Identity</h3>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <span className="text-[11px] text-muted-foreground">Provider:</span>
                            <Badge variant="outline" className="capitalize text-[10px] px-2 py-0.5">
                              {user?.provider || "email"}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground ml-2">Joined:</span>
                            <span className="text-[11px] font-medium text-foreground/80">
                              {user?.created_at
                                ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Full Name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                        />
                        <Input
                          label="Email Address"
                          value={email}
                          disabled
                        />
                      </div>
                      <div className="pt-4 flex justify-end">
                        <Button type="submit" variant="default" size="sm" isLoading={isUpdatingProfile}>
                          <Save className="w-4 h-4 mr-1.5" />
                          <span>Save Profile</span>
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card className="mt-6 border-destructive/30 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Permanently delete your account and all associated workspace records. This action is irreversible.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    {!showDeleteConfirm ? (
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="text-[11px] text-muted-foreground max-w-md">
                          Once deleted, your transcribed recordings, tasks, AI insights, and workspace details will be permanently removed.
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" />
                          <span>Delete Account</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 p-4 border border-destructive/20 rounded-xl bg-destructive/10">
                        <div className="text-xs font-semibold text-destructive">
                          Are you absolutely sure?
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Please type <strong className="text-foreground">delete my account</strong> below to confirm.
                        </div>
                        <Input
                          placeholder="delete my account"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          className="max-w-md"
                        />
                        <div className="flex gap-2 justify-end pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowDeleteConfirm(false)
                              setDeleteConfirmText("")
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteAccount}
                            isLoading={isDeletingAccount}
                            disabled={deleteConfirmText.toLowerCase() !== "delete my account"}
                          >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Confirm Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Update Password</CardTitle>
                    <CardDescription>Ensure your account is using a secure password scheme.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <Input
                          label="Current Password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                          />
                          <Input
                            label="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="pt-4 flex justify-end">
                        <Button type="submit" variant="default" size="sm" isLoading={isUpdatingPassword}>
                          <Save className="w-4 h-4 mr-1.5" />
                          <span>Update Password</span>
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
                    <CardDescription>Add an extra layer of security to your personal space.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-foreground block">Authenticator App</span>
                      <span className="text-[10px] text-muted-foreground block">Use custom verification codes via mobile auth apps.</span>
                    </div>
                    <Button
                      variant={twoFactor ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => {
                        setTwoFactor(!twoFactor)
                        toast({
                          title: "2FA Preference updated",
                          description: twoFactor ? "Two-factor authentication disabled." : "Two-factor authentication enabled successfully.",
                          variant: twoFactor ? "warning" : "success"
                        })
                      }}
                    >
                      {twoFactor ? "Disable 2FA" : "Enable 2FA"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "appearance" && (
              <motion.div
                key="appearance"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Visual Theme Options</CardTitle>
                    <CardDescription>Adjust dashboard light, dark or system default style variables.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {/* Light theme selector */}
                    <div
                      onClick={() => changeTheme("light")}
                      className={`cursor-pointer p-4 border rounded-xl flex flex-col items-center gap-3 transition-all ${
                        themeMode === "light" ? "border-primary bg-primary/[0.02] shadow-sm" : "border-border/40 bg-card hover:bg-muted/20"
                      }`}
                    >
                      <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                        <Sun className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-foreground/80">Light Mode</span>
                    </div>

                    {/* Dark theme selector */}
                    <div
                      onClick={() => changeTheme("dark")}
                      className={`cursor-pointer p-4 border rounded-xl flex flex-col items-center gap-3 transition-all ${
                        themeMode === "dark" ? "border-primary bg-primary/[0.02] shadow-sm" : "border-border/40 bg-card hover:bg-muted/20"
                      }`}
                    >
                      <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                        <Moon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-foreground/80">Dark Mode</span>
                    </div>

                    {/* System selector */}
                    <div
                      onClick={() => changeTheme("system")}
                      className={`cursor-pointer p-4 border rounded-xl flex flex-col items-center gap-3 transition-all ${
                        themeMode === "system" ? "border-primary bg-primary/[0.02] shadow-sm" : "border-border/40 bg-card hover:bg-muted/20"
                      }`}
                    >
                      <div className="p-3 rounded-lg bg-muted text-foreground/80 shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-foreground/80">System Default</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Email & Digest Alerts</CardTitle>
                    <CardDescription>Configure notifications when recordings finish parsing.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    {/* Weekly brief */}
                    <div className="flex items-center justify-between p-4 border border-border/40 rounded-xl bg-card">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-foreground block">Weekly Performance Digests</span>
                        <span className="text-[10px] text-muted-foreground block">Email a recap of meetings Cost Efficiency index scores.</span>
                      </div>
                      <button
                        role="checkbox"
                        aria-checked={emailDigests}
                        onClick={toggleEmailDigest}
                        className="cursor-pointer h-5 w-5 rounded border border-border flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        {emailDigests && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    </div>

                    {/* AI highlights */}
                    <div className="flex items-center justify-between p-4 border border-border/40 rounded-xl bg-card">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-foreground block">Instant AI Action Highlights</span>
                        <span className="text-[10px] text-muted-foreground block">Send generated action items directly to inbox post-sync.</span>
                      </div>
                      <button
                        role="checkbox"
                        aria-checked={aiHighlights}
                        onClick={toggleAiHighlights}
                        className="cursor-pointer h-5 w-5 rounded border border-border flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        {aiHighlights && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    </div>

                    {/* Transcription complete */}
                    <div className="flex items-center justify-between p-4 border border-border/40 rounded-xl bg-card">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-foreground block">Transcription Alerts</span>
                        <span className="text-[10px] text-muted-foreground block">Send browser and desktop push notifications on sync completion.</span>
                      </div>
                      <button
                        role="checkbox"
                        aria-checked={transcriptionAlerts}
                        onClick={toggleTranscriptionAlerts}
                        className="cursor-pointer h-5 w-5 rounded border border-border flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        {transcriptionAlerts && <Check className="w-3.5 h-3.5 text-primary" />}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "api" && (
              <motion.div
                key="api"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Generate form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Generate secret Token</CardTitle>
                    <CardDescription>Integrate transcription databases programmatic whispering services.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleGenerateKey} className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-grow">
                        <Input
                          label="Token Name"
                          placeholder="e.g. CLI Sync tool"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" variant="ai" size="sm" className="h-10">
                        <Plus className="w-4 h-4 mr-1.5" />
                        <span>Generate Key</span>
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* API list */}
                {apiKeys.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Active Tokens</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/40 select-none">
                        {apiKeys.map((key) => (
                          <div key={key.key} className="p-4 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-foreground block">{key.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded truncate max-w-[150px] sm:max-w-xs">{key.key}</span>
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(key.key)} className="h-6 w-6 text-muted-foreground hover:text-foreground">
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <span className="text-[9px] text-muted-foreground block">Created on {key.created}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteKey(key.key)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
