// This is an example file.
'use server';
/**
 * @fileOverview A flow to ensure generated variations align with the style of the reference image.
 *
 * - maintainStyleConsistency - A function that handles the image generation process, ensuring style consistency with a reference image.
 * - MaintainStyleConsistencyInput - The input type for the maintainStyleConsistency function.
 * - MaintainStyleConsistencyOutput - The return type for the maintainStyleConsistency function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MaintainStyleConsistencyInputSchema = z.object({
  promptText: z.string().describe('The text prompt to guide image generation.'),
  referenceImageDataUri: z
    .string()
    .describe(
      "A reference image to guide the style of the generated image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type MaintainStyleConsistencyInput = z.infer<typeof MaintainStyleConsistencyInputSchema>;

const MaintainStyleConsistencyOutputSchema = z.object({
  generatedImageDataUri: z
    .string()
    .describe('The data URI of the generated image, which includes a MIME type and uses Base64 encoding.'),
});
export type MaintainStyleConsistencyOutput = z.infer<typeof MaintainStyleConsistencyOutputSchema>;

export async function maintainStyleConsistency(
  input: MaintainStyleConsistencyInput
): Promise<MaintainStyleConsistencyOutput> {
  return maintainStyleConsistencyFlow(input);
}

const maintainStyleConsistencyPrompt = ai.definePrompt({
  name: 'maintainStyleConsistencyPrompt',
  input: {schema: MaintainStyleConsistencyInputSchema},
  output: {schema: MaintainStyleConsistencyOutputSchema},
  prompt: `Generate an image based on the following text prompt while maintaining the style of the reference image.

Text Prompt: {{{promptText}}}

Reference Image: {{media url=referenceImageDataUri}}

Please generate the image and provide its data URI.
`,
});

const maintainStyleConsistencyFlow = ai.defineFlow(
  {
    name: 'maintainStyleConsistencyFlow',
    inputSchema: MaintainStyleConsistencyInputSchema,
    outputSchema: MaintainStyleConsistencyOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {media: {url: input.referenceImageDataUri}},
        {text: input.promptText},
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Failed to generate image.');
    }

    return {generatedImageDataUri: media.url};
  }
);
