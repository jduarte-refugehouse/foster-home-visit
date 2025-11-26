'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@refugehouse/shared-core/components/ui/card'
import { Button } from '@refugehouse/shared-core/components/ui/button'
import { Input } from '@refugehouse/shared-core/components/ui/input'
import { Label } from '@refugehouse/shared-core/components/ui/label'
import { Badge } from '@refugehouse/shared-core/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@refugehouse/shared-core/components/ui/select'
import { X, Plus, Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DocumentMetadataEditorProps {
  documentId: string
  document: {
    document_name: string
    document_number: string | null
    t3c_packages: string | null
    domain: string | null
    tags: string | null
  }
  onSave: () => void
}

const T3C_PACKAGES = [
  'T3C Basic',
  'Mental & Behavioral Health',
  'IDD/Autism',
  'Substance Use',
  'Short-Term Assessment',
  'Sexual Aggression/Sex Offender',
  'Complex Medical Needs',
  'Human Trafficking',
  'T3C Treatment Foster Family Care',
  'Transition Support Services',
  'Kinship Caregiver Support',
  'Pregnant & Parenting Youth',
]

const DOMAINS = [
  'Intake',
  'Discharge',
  'Service Planning',
  'Direct Care',
  'Credentialing',
  'Recruitment & Retention',
  'Home Studies',
  'Family Engagement',
  'Health Care',
  'Aftercare',
  'Crisis Management',
  'Billing',
  'Quality Assurance',
  'Training',
]

export function DocumentMetadataEditor({ documentId, document, onSave }: DocumentMetadataEditorProps) {
  const { toast } = useToast()
  const [documentName, setDocumentName] = useState(document.document_name)
  const [documentNumber, setDocumentNumber] = useState(document.document_number || '')
  const [t3cPackages, setT3cPackages] = useState<string[]>(
    document.t3c_packages ? JSON.parse(document.t3c_packages) : []
  )
  const [domain, setDomain] = useState(document.domain || '__none__')
  const [tags, setTags] = useState<string[]>(
    document.tags ? JSON.parse(document.tags) : []
  )
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAddPackage = (pkg: string) => {
    if (!t3cPackages.includes(pkg)) {
      setT3cPackages([...t3cPackages, pkg])
    }
  }

  const handleRemovePackage = (pkg: string) => {
    setT3cPackages(t3cPackages.filter(p => p !== pkg))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/policies/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentName,
          documentNumber: documentNumber || null,
          t3cPackages: t3cPackages.length > 0 ? t3cPackages : null,
          domain: domain === '__none__' ? null : domain || null,
          tags: tags.length > 0 ? tags : null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update document')
      }

      toast({
        title: 'Document Updated',
        description: 'Document metadata has been saved successfully',
        variant: 'default',
      })

      onSave()
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Pencil className="w-5 h-5" />
          Edit Metadata
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="documentName">Document Name</Label>
          <Input
            id="documentName"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="documentNumber">Document Number</Label>
          <Input
            id="documentNumber"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="e.g., FC-T3C-01, FC2-01"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Domain</Label>
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {DOMAINS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>T3C Packages</Label>
          <div className="flex flex-wrap gap-2 mt-2 mb-2">
            {t3cPackages.map((pkg) => (
              <Badge key={pkg} variant="outline" className="flex items-center gap-1">
                {pkg}
                <button
                  onClick={() => handleRemovePackage(pkg)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Select onValueChange={handleAddPackage}>
            <SelectTrigger>
              <SelectValue placeholder="Add T3C package" />
            </SelectTrigger>
            <SelectContent>
              {T3C_PACKAGES.filter(pkg => !t3cPackages.includes(pkg)).map((pkg) => (
                <SelectItem key={pkg} value={pkg}>
                  {pkg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mt-2 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              placeholder="Add tag and press Enter"
            />
            <Button type="button" onClick={handleAddTag} variant="outline" size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

