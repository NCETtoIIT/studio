'use server';
/**
 * @fileOverview A Genkit flow to identify and fix undesired results in the image generated from a prompt.
 *
 * - fixUndesiredImageResults - A function that handles the process of fixing undesired image results.
 * - FixUndesiredImageResultsInput - The input type for the fixUndesiredImageResults function.
 * - FixUndesiredImageResultsOutput - The return type for the fixUndesiredImageResults function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FixUndesiredImageResultsInputSchema = z.object({
  image: z
    .string()
    .describe(
      'The image to be fixed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Ensure proper documentation for data URI format
    ),
  prompt: z.string().describe('The prompt used to generate the image.'),
  descriptionOfUndesiredElements: z
    .string()
    .describe('A description of the elements in the image that are undesired.'),
});
export type FixUndesiredImageResultsInput = z.infer<
  typeof FixUndesiredImageResultsInputSchema
>;

const FixUndesiredImageResultsOutputSchema = z.object({
  fixedImage: z
    .string()
    .describe(
      'The fixed image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Ensure proper documentation for data URI format
    ),
});
export type FixUndesiredImageResultsOutput = z.infer<
  typeof FixUndesiredImageResultsOutputSchema
>;

export async function fixUndesiredImageResults(
  input: FixUndesiredImageResultsInput
): Promise<FixUndesiredImageResultsOutput> {
  return fixUndesiredImageResultsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'fixUndesiredImageResultsPrompt',
  input: {schema: FixUndesiredImageResultsInputSchema},
  output: {schema: FixUndesiredImageResultsOutputSchema},
  prompt: `You are an AI image editing expert. Your task is to fix undesired elements in an image based on a user's description.

  The original prompt used to generate the image was: {{{prompt}}}

  The user has identified the following undesired elements: {{{descriptionOfUndesiredElements}}}

  Here is the image:
  {{media url=image}}

  Please generate a new version of the image with the undesired elements removed or altered according to the user's description.  Ensure that the new image maintains the overall style and composition of the original image while addressing the identified issues.

  Return the fixed image as a data URI in the 'fixedImage' field.
`,
});

const fixUndesiredImageResultsFlow = ai.defineFlow(
  {
    name: 'fixUndesiredImageResultsFlow',
    inputSchema: FixUndesiredImageResultsInputSchema,
    outputSchema: FixUndesiredImageResultsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
