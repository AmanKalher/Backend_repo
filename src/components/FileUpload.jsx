import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FileUpload({
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSizeMB = 10,
  onFileSelect,
  className = '',
  label = 'Drag and drop medical documents here, or browse files',
}) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const inputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const validateAndProcessFile = (file) => {
    setErrorMessage('')
    if (!file) return

    const sizeInMB = file.size / (1024 * 1024)
    if (sizeInMB > maxSizeMB) {
      setErrorMessage(`File exceeds maximum allowed size of ${maxSizeMB}MB`)
      return
    }

    const fileData = {
      file,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type || file.name.split('.').pop().toUpperCase(),
      uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      uploadedBy: 'Dr. Rahul Sharma',
    }

    setSelectedFile(fileData)
    if (onFileSelect) {
      onFileSelect(fileData)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0])
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setErrorMessage('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    if (onFileSelect) {
      onFileSelect(null)
    }
  }

  const formatFileIcon = (fileName = '') => {
    const ext = fileName.split('.').pop().toLowerCase()
    if (ext === 'pdf') return '📄'
    if (['jpg', 'jpeg', 'png'].includes(ext)) return '🖼️'
    return '📁'
  }

  return (
    <div className={`file-upload-component ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {!selectedFile ? (
        <motion.div
          className={`dropzone-container ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current && inputRef.current.click()}
          whileHover={{ scale: 1.01, borderColor: '#7c3aed' }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div className="dropzone-icon-wrap" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="upload-cloud-icon">
              <path
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <div className="dropzone-text-group">
            <p className="dropzone-primary-text">{label}</p>
            <p className="dropzone-sub-text">
              Supports PDF, PNG, JPG, JPEG (Max {maxSizeMB}MB)
            </p>
          </div>
          <button type="button" className="browse-files-btn" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>
            Browse Files
          </button>
        </motion.div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="uploaded-file-preview-card"
          >
            <div className="file-preview-left">
              <span className="file-type-icon">{formatFileIcon(selectedFile.name)}</span>
              <div className="file-meta-details">
                <span className="file-display-name">{selectedFile.name}</span>
                <span className="file-meta-sub">
                  {selectedFile.size} • {selectedFile.uploadDate} • {selectedFile.uploadedBy}
                </span>
              </div>
            </div>

            <div className="file-preview-actions">
              <button
                type="button"
                className="replace-file-btn"
                onClick={() => inputRef.current && inputRef.current.click()}
              >
                Replace
              </button>
              <button
                type="button"
                className="remove-file-btn"
                onClick={handleRemove}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {errorMessage && (
        <p className="upload-error-text">{errorMessage}</p>
      )}
    </div>
  )
}
