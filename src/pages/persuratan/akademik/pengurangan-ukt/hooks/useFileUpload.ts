import { useState } from 'react';
import { message, UploadFile, UploadProps } from 'antd';
import { Upload } from 'antd';

const MAX_FILE_SIZE_MB = 10;

const getUploadURL = () => {
  return process.env.UMI_APP_PUBLIC_API_URL + '/v1/pengajuan/lampiran/upload';
};

interface UseFileUploadOptions {
  maxSizeMB?: number;
  acceptedType?: string;
  onSuccess?: (filename: string) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    maxSizeMB = MAX_FILE_SIZE_MB,
    acceptedType = 'application/pdf',
    onSuccess
  } = options;

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedFilenames, setUploadedFilenames] = useState<string[]>([]);

  const uploadProps: UploadProps = {
    name: 'file',
    maxCount: 1,
    fileList,
    action: getUploadURL(),
    method: 'post',
    withCredentials: true,
    
    beforeUpload: (file) => {
      const isCorrectType = file.type === acceptedType;
      const isValidSize = file.size / 1024 / 1024 <= maxSizeMB;

      if (!isCorrectType) {
        message.error('Hanya file PDF yang diperbolehkan!');
        return Upload.LIST_IGNORE;
      }

      if (!isValidSize) {
        message.error(`Ukuran file harus kurang dari atau sama dengan ${maxSizeMB} MB!`);
        return Upload.LIST_IGNORE;
      }

      setFileList([file]);
      return true;
    },
    
    onChange(info) {
      if (info.file.status === 'done') {
        const filename = info?.file?.response?.data?.filename;
        if (filename) {
          setUploadedFilenames(prev => [...prev, filename]);
          onSuccess?.(filename);
        }
        message.success(`${info.file.name} berhasil diupload`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} gagal diupload.`);
      }
    },
    
    onRemove: (file) => {
      setFileList([]);
      const filename = (file as any)?.response?.data?.filename;
      if (filename) {
        setUploadedFilenames(prev => prev.filter(x => x !== filename));
      }
    },
  };

  const reset = () => {
    setFileList([]);
    setUploadedFilenames([]);
  };

  return {
    fileList,
    uploadedFilenames,
    uploadProps,
    reset,
    hasFile: fileList.length > 0
  };
};