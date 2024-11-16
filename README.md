# Spooky Pet App 🎃👻🧟🐶🐱

## [Create your application](https://vite.dev/guide/#scaffolding-your-first-vite-project)

```shell
npm create vite@latest
```

```shell
✔ Project name: … mascota-espeluznante
✔ Select a framework: › React
✔ Select a variant: › TypeScript
```

```shell
cd mascota-espeluznante
npm install
npm run dev
```

## [Configure Amplify](https://docs.amplify.aws/react/start/manual-installation/)

```shell
npm create amplify@latest
```

## [Configure AWS for local development](https://docs.amplify.aws/react/start/account-setup/)

If you don't have the AWS CLI installed and an AWS profile configured on your machine, do so by following [this guide](https://docs.amplify.aws/react/start/account-setup/).

## [Deploy Cloud Sandbox](https://docs.amplify.aws/react/deploy-and-host/sandbox-environments/setup/)

```shell
npx ampx sandbox
```

## [Configure Amplify](https://docs.amplify.aws/react/start/connect-to-aws-resources/)

By deploying the project to your cloud sandbox, Amplify will generate a [`amplify_outputs.json`](https://docs.amplify.aws/react/reference/amplify_outputs/) at the root of your project. This file contains the backend configuration of your project.

The Amplify client libraries need the client config in order to use the library APIs to connect to backend resources. On your `main.tsx` file:

```typescript
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);
```

## [Setup Storage](https://docs.amplify.aws/react/build-a-backend/storage/set-up-storage/)

Create a file `amplify/storage/resource.ts`:

```typescript
import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'mascotas',
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['write']),
    ]
  })
});
```

Import your storage definition in your `amplify/backend.ts` file:

```typescript
import { storage } from './storage/resource'

defineBackend({
  ...
  storage,
});
```

## [Upload Files](https://docs.amplify.aws/javascript/build-a-backend/storage/upload-files/)

Use Amplify UI component [FileUploader](https://ui.docs.amplify.aws/react/connected-components/storage/fileuploader
) to upload files to S3 bucket:

```shell
npm add @aws-amplify/ui-react-storage
```

Use `FileUplaoder` on `src/App.tsx` file:

```typescript
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

```

## [Setup a Function](https://docs.amplify.aws/react/build-a-backend/functions/set-up-function/)

Create a new folder for the function definition under `amplify/functions/` with the function name. For instance `amplify/functions/generate-calaverita/`.

Inside this folder, create a resource definition file `resource.ts`:

```typescript
import { defineFunction } from "@aws-amplify/backend";

export const MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0";

export const generateCalaverita = defineFunction({
    name: 'generateCalaverita',
    entry: './handler.ts',
    environment: {
        MODEL_ID: MODEL_ID,
    },
    timeoutSeconds: 30,
});
```
Install the `@aws-sdk/client-bedrock-runtime` so our function code can use the Amazon Bedrock client.

```shell
npm install @aws-sdk/client-bedrock-runtime
```
