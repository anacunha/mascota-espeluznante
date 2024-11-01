import { useState } from 'react'
import { FileUploader } from '@aws-amplify/ui-react-storage';
import './App.css'
import '@aws-amplify/ui-react/styles.css';

export default function App() {

  const [fileKey, setFileKey] = useState<string | null>(null);

  const processFile = async (params: { file: File }) => {
    const fileExtension = params.file.name.split('.').pop() || '';
    const filebuffer = await params.file.arrayBuffer();
    const hashBuffer = await window.crypto.subtle.digest('SHA-1', filebuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');

    const key = `${hashHex}.${fileExtension}`;
    setFileKey(key);

    return {
      file: params.file,
      key: key,
    };
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 dark:text-white">
      <div>
        <h1 className="text-3xl font-bold text-center mb-4">Mascota Espeluznante 🧟‍♀️</h1>
        <form className="mb-4 self-center max-w-[500px] space-y-4">
          <FileUploader
            acceptedFileTypes={['image/*']}
            path="public/"
            maxFileCount={1}
            processFile={processFile}
          />
          </form>
        </div>
    </main>
  );
}
