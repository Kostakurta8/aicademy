'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Award, Download, Star, Trophy } from 'lucide-react'

export default function CertificatePage() {
  const [name, setName] = useState('')
  const [generated, setGenerated] = useState(false)

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const handleGenerate = () => {
    if (name.trim()) setGenerated(true)
  }

  const handleDownload = () => {
    // Simple text-based certificate export
    const certText = `
╔══════════════════════════════════════════════════════╗
║                                                      ║
║              CERTIFICATE OF COMPLETION               ║
║                                                      ║
║                     AIcademy                         ║
║           AI Literacy Learning Platform              ║
║                                                      ║
║   This certifies that                                ║
║                                                      ║
║              ${name.padStart(25).padEnd(40)}    ║
║                                                      ║
║   has successfully completed the AIcademy            ║
║   AI Literacy curriculum, demonstrating              ║
║   proficiency in:                                    ║
║                                                      ║
║   • AI Fundamentals & LLM Architecture              ║
║   • Prompt Engineering Techniques                    ║
║   • AI Ethics & Responsible Use                      ║
║   • Building with AI APIs                            ║
║   • Real-World AI Applications                       ║
║                                                      ║
║   Date: ${today.padEnd(43)}║
║                                                      ║
╚══════════════════════════════════════════════════════╝`

    const blob = new Blob([certText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `AIcademy-Certificate-${name.replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8 text-center animate-fade-in">
        <Trophy size={48} className="text-gold mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-text-primary mb-2">Certificate of Completion</h1>
        <p className="text-text-secondary">Generate your personalized AIcademy certificate.</p>
      </div>

      {!generated ? (
        <Card padding="lg" className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Enter Your Name</h2>
          <Input label="Full Name (as it will appear on the certificate)" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          <Button onClick={handleGenerate} disabled={!name.trim()} icon={<Award size={16} />} className="w-full mt-4">Generate Certificate</Button>
        </Card>
      ) : (
        <div className="animate-fade-in">
          {/* Certificate preview */}
          <div className="relative bg-gradient-to-br from-[#1a1033] via-[#0f0f2e] to-[#0a1628] rounded-2xl border-2 border-gold/30 p-8 md:p-12 mb-6 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gold/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />

            <div className="relative text-center">
              <div className="flex justify-center gap-2 mb-4">
                <Star size={20} className="text-gold" />
                <Star size={24} className="text-gold" />
                <Star size={20} className="text-gold" />
              </div>

              <p className="text-xs uppercase tracking-[0.3em] text-gold/70 mb-2">Certificate of Completion</p>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gold to-amber-300 bg-clip-text text-transparent mb-6">
                AIcademy
              </h2>
              <p className="text-xs text-text-muted mb-1">This certifies that</p>
              <p className="text-2xl font-bold text-text-primary mb-6 font-serif italic">{name}</p>
              <p className="text-sm text-text-secondary leading-relaxed max-w-md mx-auto mb-6">
                has successfully completed the AIcademy AI Literacy curriculum, demonstrating proficiency in AI fundamentals, prompt engineering, ethics, and practical AI applications.
              </p>

              <div className="flex justify-center gap-6 mb-6">
                {['AI Fundamentals', 'Prompt Engineering', 'AI Ethics', 'Building with APIs', 'Real-World Projects'].map((skill) => (
                  <div key={skill} className="text-center">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-1">
                      <Award size={14} className="text-accent" />
                    </div>
                    <p className="text-[9px] text-text-muted max-w-[60px]">{skill}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gold/20 pt-4">
                <p className="text-xs text-text-muted">{today}</p>
                <p className="text-[10px] text-text-muted/50 mt-1">AIcademy — AI Literacy Learning Platform</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={handleDownload} icon={<Download size={16} />}>Download Certificate</Button>
            <Button variant="ghost" onClick={() => setGenerated(false)}>Edit Name</Button>
          </div>
        </div>
      )}
    </div>
  )
}
