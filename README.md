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

Create the handler for the function on `amplify/functions/generate-calaverita/handler.ts`:

```typescript
import { Schema } from '../../data/resource';
import { BedrockRuntimeClient, InvokeModelCommand, InvokeModelCommandInput } from '@aws-sdk/client-bedrock-runtime';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$amplify/env/generateCalaverita';

// initialize bedrock runtime client
const client = new BedrockRuntimeClient();
const s3Client = new S3Client();

async function getImageFromS3(bucket: string, key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);

    // Convert the readable stream to a buffer
    const chunks = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Convert to base64
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error reading file from S3:', error);
    throw error;
  }
}

export const handler: Schema['generateCalaverita']['functionHandler'] = async (event) => {
  // User prompt
  const prompt = event.arguments.prompt;
  const photo = event.arguments.photo;

  // Get image from S3
  const encoded_image = await getImageFromS3(
    env.MASCOTAS_BUCKET_NAME,
    `public/${photo}`
  );

  // Invoke model
  const input = {
    modelId: process.env.MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      system:
        'Crea un nombre tenebroso de halloween y una calaverita literaria mexicana para una mascota en base a su nombre, signo del zodiaco, comida favorita y raza.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              'type': 'image',
              'source': {
                'type': 'base64',
                'media_type': 'image/jpeg',
                'data': encoded_image
              }
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.5,
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);

  const response = await client.send(command);

  // Parse the response and return the generated calaverita
  const data = JSON.parse(Buffer.from(response.body).toString());

  return data.content[0].text;
};
```

Update the storage definition under `amplify/storage/resource.ts` so that our Lambda function can access the S3 bucket:

```typescript
import { defineStorage } from '@aws-amplify/backend';
import { generateCalaverita } from '../functions/generate-calaverita/resource';

export const storage = defineStorage({
  name: 'mascotas',
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['write']),
      allow.resource(generateCalaverita).to(['read']),
    ]
  })
});
```

Update `App.tsx:

```typescript
import type { Schema } from "../amplify/data/resource";
import type { FormEvent } from 'react';
import { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { FileUploader } from '@aws-amplify/ui-react-storage';
import { Input, Label, Flex, SelectField } from '@aws-amplify/ui-react';
import './App.css'
import '@aws-amplify/ui-react/styles.css';

const client = generateClient<Schema>();

interface IPet {
  name: string;
  sign: string;
  food: string;
  breed: string;
}

export default function App() {
  const [pet, setPet] = useState<IPet>({name: '', sign: '', food: '', breed: ''});
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPet(prevPet => ({
      ...prevPet,
      [name]: value
    }));
  };

  const sendPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fileKey) {
      alert('Please upload an image first');
      return;
    }

    const prompt = `Nombre: ${pet.name}, Signo: ${pet.sign}, Comida Favorita: ${pet.food}, Raza: ${pet.breed}`;
    const { data, errors } = await client.queries.generateCalaverita({
      prompt,
      photo: fileKey
    });

    if (!errors) {
      setAnswer(data);
      // Reset form after successful submission
      setPet({name: '', sign: '', food: '', breed: ''});
      setFileKey(null);
    } else {
      console.log(errors);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 dark:text-white">
      <div>
        <h1 className="text-3xl font-bold text-center mb-4">Spooky Pet 🧟‍♀️</h1>
        <form className="mb-4 self-center max-w-[500px] space-y-4" onSubmit={sendPrompt}>
          <FileUploader
            acceptedFileTypes={['image/*']}
            path="public/"
            maxFileCount={1}
            processFile={processFile}
          />

          <Flex direction="column" gap="small">
            <Label htmlFor="Nombre">Nombre:</Label>
            <Input id="name" name="name" value={pet.name} onChange={handleInputChange} required />
          </Flex>

          <SelectField label="Signo" name="sign" value={pet.sign} onChange={handleInputChange} required>
          <option value="">Selecciona un signo zodiacal</option>
            <option value="ARIES">Aries</option>
            <option value="TAURUS">Taurus</option>
            <option value="GEMINI">Gemini</option>
            <option value="CANCER">Cancer</option>
            <option value="LEO">Leo</option>
            <option value="VIRGO">Virgo</option>
            <option value="LIBRA">Libra</option>
            <option value="SCORPIO">Scorpio</option>
            <option value="SAGITTARIUS">Sagittarius</option>
            <option value="CAPRICORN">Capricorn</option>
            <option value="AQUARIUS">Aquarius</option>
            <option value="PISCES">Pisces</option>

          </SelectField>

          <Flex direction="column" gap="small">
            <Label htmlFor="Comida">Comida favorita:</Label>
            <Input id="food" name="food" value={pet.food} onChange={handleInputChange} required />
          </Flex>

          <Flex direction="column" gap="small">
            <Label htmlFor="Raza">Raza:</Label>
            <Input id="breed" name="breed" value={pet.breed} onChange={handleInputChange} required />
          </Flex>

          <button
            disabled={!fileKey}
            className="... disabled:bg-gray-400"
          >
            Generar Calaverita
          </button>
        </form>

        <div className="text-center">
          {answer && (
            <pre className="whitespace-pre-wrap text-left bg-gray-800 p-4 rounded">
              {answer}
            </pre>
          )}
        </div>
      </div>
    </main>
  );
}
```
