import { FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getFileUrl } from '../../services/firebaseUrlService';

const FileIcon = ({ file, className = "w-10 h-10 rounded-lg bg-dark-200 hover:bg-dark-300 flex items-center justify-center border-2 border-dark-200 hover:border-primary-500 transition-colors" }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFileUrl = async () => {
      try {
        const url = await getFileUrl(file.fileUrl);
        setFileUrl(url);
      } catch (error) {
        console.error('Error loading file URL:', error);
      } finally {
        setLoading(false);
      }
    };

    if (file?.fileUrl) {
      loadFileUrl();
    }
  }, [file]);

  if (loading || !fileUrl) {
    return (
      <div className={className}>
        <FileText className="w-4 h-4 text-dark-400" />
      </div>
    );
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      title={`View ${file.fileName}`}
    >
      <FileText className="w-4 h-4 text-dark-400" />
    </a>
  );
};

export default FileIcon;

