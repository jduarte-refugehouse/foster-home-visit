"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, AlertCircle } from "lucide-react"

export default function UploadData() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setMessage("")
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file to upload")
      return
    }

    setUploading(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setMessage(`Successfully imported ${result.familiesCount} families and ${result.placementsCount} placements`)
        setFile(null)
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.message}`)
      }
    } catch (error) {
      setMessage("An error occurred while uploading the file")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Data</h1>
        <p className="text-gray-600">Import family and placement data from Radius XML files</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              XML Data Import
            </CardTitle>
            <CardDescription>
              Upload XML files exported from the Radius system to import family and placement data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">Select XML File</Label>
              <Input id="file" type="file" accept=".xml" onChange={handleFileChange} className="mt-1" />
            </div>

            {file && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span>
                <span>({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}

            <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
              {uploading ? "Uploading..." : "Upload and Import"}
            </Button>

            {message && (
              <div
                className={`flex items-center space-x-2 p-3 rounded-md ${
                  message.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Import Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• XML files must be exported from the Radius system</li>
              <li>• Files should contain family and placement information</li>
              <li>• Existing records will be updated if they already exist</li>
              <li>• Maximum file size: 10MB</li>
              <li>• Supported format: XML only</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
