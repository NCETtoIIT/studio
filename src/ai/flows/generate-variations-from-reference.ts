'use server';
/**
 * @fileOverview Generates variations of a reference image using AI.
 *
 * - generateVariationsFromReference - A function that generates variations of a reference image.
 * - GenerateVariationsFromReferenceInput - The input type for the generateVariationsFromReference function.
 * - GenerateVariationsFromReferenceOutput - The return type for the generateVariationsFromReference function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVariationsFromReferenceInputSchema = z.object({
  referenceImage: z
    .string()
    .describe(
      "A reference image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('A text prompt describing the desired variations.'),
  numberOfVariations: z
    .number()
    .default(4)
    .describe('The number of image variations to generate.'),
});
export type GenerateVariationsFromReferenceInput = z.infer<
  typeof GenerateVariationsFromReferenceInputSchema
>;

const GenerateVariationsFromReferenceOutputSchema = z.object({
  variations: z.array(z.string()).describe('An array of data URIs representing the generated image variations.'),
});
export type GenerateVariationsFromReferenceOutput = z.infer<
  typeof GenerateVariationsFromReferenceOutputSchema
>;

export async function generateVariationsFromReference(
  input: GenerateVariationsFromReferenceInput
): Promise<GenerateVariationsFromReferenceOutput> {
  return generateVariationsFromReferenceFlow(input);
}

const generateVariationsFromReferencePrompt = ai.definePrompt({
  name: 'generateVariationsFromReferencePrompt',
  input: {schema: GenerateVariationsFromReferenceInputSchema},
  output: {schema: GenerateVariationsFromReferenceOutputSchema},
  prompt: `Generate variations of the following image based on the prompt provided.

Reference Image: {{media url=referenceImage}}
Prompt: {{{prompt}}}

Return an array of data URIs representing the generated image variations. The number of variations is specified by numberOfVariations.`,
});

const generateVariationsFromReferenceFlow = ai.defineFlow(
  {
    name: 'generateVariationsFromReferenceFlow',
    inputSchema: GenerateVariationsFromReferenceInputSchema,
    outputSchema: GenerateVariationsFromReferenceOutputSchema,
  },
  async input => {
    const variations = [];
    for (let i = 0; i < input.numberOfVariations; i++) {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: [
          {media: {url: input.referenceImage}},
          {text: input.prompt + `(Variation ${i + 1})`},
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });
      if (media) {
        variations.push(media.url);
      }
    }
    return {variations};
  }
);
