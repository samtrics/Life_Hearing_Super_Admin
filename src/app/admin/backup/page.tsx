"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchBackupData, fetchBackupStats } from '@/app/actions/backup'
import CryptoJS from 'crypto-js'
import { Database, Download, RefreshCw, CheckCircle2, Clock, AlertCircle, HardDrive } from 'lucide-react'

interface BackupRecord {
  id: string
  created_at: string
  total_appointments: number
  total_patients: number
  file_name: string
  triggered_by: string
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [backupPassword, setBackupPassword] = useState('')
  const [stats, setStats] = useState({ appointments: 0, patients: 0, feedbacks: 0 })

  // Using server actions instead of client supabase

  useEffect(() => {
    loadStats()
    loadBackupHistory()
  }, [])

  const loadStats = async () => {
    const { appointments: apptCount, feedbacks: feedbackCount } = await fetchBackupStats()
    setStats({
      appointments: apptCount || 0,
      patients: apptCount || 0, // using distinct phone numbers as proxy
      feedbacks: feedbackCount || 0,
    })
  }

  const loadBackupHistory = async () => {
    setLoading(true)
    // Use localStorage for backup history since there's no dedicated table
    try {
      const stored = localStorage.getItem('backup_history')
      if (stored) {
        // Decrypt the AES local storage block back into JSON
        const SECRET = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback'
        const decrypted = CryptoJS.AES.decrypt(stored, SECRET).toString(CryptoJS.enc.Utf8)
        setBackups(JSON.parse(decrypted))
      }
    } catch (e) {
      // If decryption fails (e.g. old plain-text JSON exists), wipe it for security.
      localStorage.removeItem('backup_history')
      setBackups([])
    }
    setLoading(false)
  }

  const generateBackup = async () => {
    if (!backupPassword || backupPassword.length < 8) {
      alert('Please enter a secure password (at least 8 characters) to encrypt your backup.');
      return;
    }

    setGenerating(true)
    try {
      // Fetch all data securely via Server Action
      const { appointments, patients, feedbacks, subscribers } = await fetchBackupData()

      const backupData = {
        generated_at: new Date().toISOString(),
        summary: {
          total_appointments: appointments?.length || 0,
          total_patients: patients?.length || 0,
          total_feedbacks: feedbacks?.length || 0,
          total_subscribers: subscribers?.length || 0,
        },
        appointments: appointments || [],
        patients: patients || [],
        feedbacks: feedbacks || [],
        newsletter_subscribers: subscribers || [],
      }

      // Encrypt the JSON string using AES
      const jsonString = JSON.stringify(backupData, null, 2);
      const encryptedString = CryptoJS.AES.encrypt(jsonString, backupPassword).toString();

      // Create and trigger download of the encrypted file
      const blob = new Blob([encryptedString], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const fileName = `life-hearing-backup-${new Date().toISOString().split('T')[0]}.json.enc`
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Save to backup history in localStorage
      const newRecord: BackupRecord = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        total_appointments: appointments?.length || 0,
        total_patients: patients?.length || 0,
        file_name: fileName,
        triggered_by: 'Manual',
      }

      const SECRET = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fallback'
      let existing = []
      try {
        const stored = localStorage.getItem('backup_history')
        if (stored) existing = JSON.parse(CryptoJS.AES.decrypt(stored, SECRET).toString(CryptoJS.enc.Utf8))
      } catch (e) {}

      const updated = [newRecord, ...existing].slice(0, 20) // keep last 20
      
      // Encrypt the history before storing it
      const encryptedHistory = CryptoJS.AES.encrypt(JSON.stringify(updated), SECRET).toString()
      localStorage.setItem('backup_history', encryptedHistory)
      setBackups(updated)
    } catch (err) {
      console.error('Backup failed:', err)
      alert('Backup failed. Please try again.')
    }
    setGenerating(false)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Backup</h1>
          <p className="text-muted-foreground mt-2">Download a complete snapshot of your clinic's data at any time.</p>
        </div>
        <div className="flex flex-col gap-2">
          <input 
            type="password"
            value={backupPassword}
            onChange={(e) => setBackupPassword(e.target.value)}
            placeholder="Enter Encryption Password"
            className="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm min-w-[250px]"
          />
          <Button
            onClick={generateBackup}
            disabled={generating || backupPassword.length < 8}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {generating ? (
              <><RefreshCw className="h-5 w-5 animate-spin" /> Encrypting...</>
            ) : (
              <><Download className="h-5 w-5" /> Download Secure Backup</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center font-medium">Password must be at least 8 characters.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Appointments</p>
              <p className="text-3xl font-extrabold">{stats.appointments}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Feedbacks</p>
              <p className="text-3xl font-extrabold">{stats.feedbacks}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <HardDrive className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Last Backup</p>
              <p className="text-base font-bold">{backups.length > 0 ? formatDate(backups[0].created_at) : 'Never'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Reminder Banner */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
        <CardContent className="py-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-amber-800 dark:text-amber-400">Monthly Backup Reminder</p>
            <p className="text-sm text-amber-700 dark:text-amber-500">
              We recommend downloading a backup at the end of every month and storing it safely.
              Click <strong>"Download Backup Now"</strong> to create a complete JSON file of all appointments, patient data, feedbacks, and newsletter subscribers.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Backup History
          </CardTitle>
          <CardDescription>The last {backups.length} backups generated from this device</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="font-semibold text-muted-foreground">No backups yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Download Backup Now" to create your first backup.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup, index) => (
                <div key={backup.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Database className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{backup.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(backup.created_at)} · {backup.triggered_by}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-11 sm:pl-0">
                    <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full font-medium">
                      {backup.total_appointments} appointments
                    </span>
                    {index === 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">Latest</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
