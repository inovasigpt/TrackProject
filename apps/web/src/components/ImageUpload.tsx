
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, UploadCloud, Image as ImageIcon, Loader, Eye } from 'lucide-react';

interface ImageUploadProps {
    value: string[];
    onChange: (urls: string[]) => void;
    disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ value = [], onChange, disabled }) => {
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setUploading(true);
        const newUrls: string[] = [];

        try {
            // 1. Get Signature from Backend
            // Use relative path '/api' which will be handled by Vite proxy or deployed URL
            // But here we are in a component, so we should rely on the configured API URL.
            // Let's use the explicit localhost:3001 if we want to be quick, or better, reuse the api service constant if exported.
            // For now, hardcoding correct port: 3001
            const signatureRes = await fetch('http://localhost:3001/api/upload/signature');
            if (!signatureRes.ok) throw new Error('Failed to get upload signature');
            const { signature, timestamp, cloudName, apiKey } = await signatureRes.json();

            // 2. Upload to Cloudinary
            const uploadPromises = acceptedFiles.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('api_key', apiKey);
                formData.append('timestamp', timestamp.toString());
                formData.append('signature', signature);
                // formData.append('folder', 'bug-tracker'); // Optional: organize in folders

                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) {
                    const error = await uploadRes.json();
                    throw new Error(error.message || 'Upload failed');
                }

                const data = await uploadRes.json();
                return data.secure_url;
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            onChange([...value, ...uploadedUrls]);

        } catch (error) {
            console.error('Upload Error:', error);
            alert('Upload failed. Check console for details.');
        } finally {
            setUploading(false);
        }
    }, [onChange, value]);

    const removeImage = (urlToRemove: string) => {
        onChange(value.filter(url => url !== urlToRemove));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
        },
        disabled: disabled || uploading
    });

    return (
        <div className="space-y-4">
            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-[#3c444d] hover:border-gray-500'}
                    ${(disabled || uploading) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-gray-400">
                    {uploading ? (
                        <>
                            <Loader size={24} className="animate-spin text-blue-500" />
                            <p className="text-sm">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <UploadCloud size={32} />
                            <p className="text-sm font-medium">Click or drag images here to upload</p>
                            <p className="text-xs text-gray-500">Supports: JPG, PNG, WEBP</p>
                        </>
                    )}
                </div>
            </div>

            {/* Image Preview Grid */}
            {value.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {value.map((url, index) => (
                        <div key={index} className="relative group aspect-square bg-[#2c333a] rounded overflow-hidden border border-[#3c444d]">
                            <img
                                src={url}
                                alt={`Attachment ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                                    title="View Full Image"
                                >
                                    <Eye size={16} />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => removeImage(url)}
                                    className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                    title="Remove Image"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
