import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'mascotas',
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['write']),
    ]
  })
});
