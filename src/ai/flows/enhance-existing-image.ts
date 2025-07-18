// src/ai/flows/enhance-existing-image.ts
'use server';

/**
 * @fileOverview AI flow to enhance the quality of an existing image or apply a different style.
 *
 * - enhanceExistingImage - A function that enhances the quality of an existing image or applies a different style.
 * - EnhanceExistingImageInput - The input type for the enhanceExistingImage function.
 * - EnhanceExistingImageOutput - The return type for the enhanceExistingImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceExistingImageInputSchema = z.object({
  existingImageDataUri: z
    .string()
    .describe(
      'The existing image to be enhanced, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
  enhancementDescription: z
    .string()
    .describe(
      'A description of the desired enhancements or style transformations to apply to the image.'
    ),
});
export type EnhanceExistingImageInput = z.infer<typeof EnhanceExistingImageInputSchema>;

const EnhanceExistingImageOutputSchema = z.object({
  enhancedImageDataUri: z
    .string()
    .describe('The enhanced image, as a data URI.'),
});
export type EnhanceExistingImageOutput = z.infer<typeof EnhanceExistingImageOutputSchema>;

export async function enhanceExistingImage(
  input: EnhanceExistingImageInput
): Promise<EnhanceExistingImageOutput> {
  return enhanceExistingImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceExistingImagePrompt',
  input: {schema: EnhanceExistingImageInputSchema},
  output: {schema: EnhanceExistingImageOutputSchema},
  prompt: [
    {media: {url: '{{{existingImageDataUri}}}'}},
    {
      text:
        'Enhance the provided image according to the following description: {{{enhancementDescription}}}.'
    },
    {
      text:
        'Output the enhanced image as a data URI. Keep the original resolution of the image.'
    },
  ],
  model: 'googleai/gemini-2.0-flash-preview-image-generation',
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
});

const enhanceExistingImageFlow = ai.defineFlow(
  {
    name: 'enhanceExistingImageFlow',
    inputSchema: EnhanceExistingImageInputSchema,
    outputSchema: EnhanceExistingImageOutputSchema,
  },
  async input => {
    const {media} = await prompt(input);
    return {enhancedImageDataUri: media!.url!};
  }
);
