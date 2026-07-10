'use server';
/**
 * @fileOverview A Genkit flow for generating AI-powered product descriptions.
 *
 * - aiProductDescriptionGenerator - A function that handles the generation of product descriptions.
 * - AIProductDescriptionGeneratorInput - The input type for the aiProductDescriptionGenerator function.
 * - AIProductDescriptionGeneratorOutput - The return type for the aiProductDescriptionGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIProductDescriptionGeneratorInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  keyFeatures: z
    .array(z.string())
    .describe('A list of key features of the product, e.g., ["Waterproof", "Long-lasting battery"]').optional(),
  attributes: z
    .array(z.string())
    .describe('Additional attributes or selling points of the product, e.g., ["Eco-friendly materials", "Easy to use"]').optional(),
});
export type AIProductDescriptionGeneratorInput = z.infer<
  typeof AIProductDescriptionGeneratorInputSchema
>;

const AIProductDescriptionGeneratorOutputSchema = z.object({
  description: z.string().describe('The generated compelling product description.'),
});
export type AIProductDescriptionGeneratorOutput = z.infer<
  typeof AIProductDescriptionGeneratorOutputSchema
>;

export async function aiProductDescriptionGenerator(
  input: AIProductDescriptionGeneratorInput
): Promise<AIProductDescriptionGeneratorOutput> {
  return aiProductDescriptionGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiProductDescriptionGeneratorPrompt',
  input: {schema: AIProductDescriptionGeneratorInputSchema},
  output: {schema: AIProductDescriptionGeneratorOutputSchema},
  prompt: `You are an expert copywriter specializing in creating compelling and unique product descriptions for e-commerce. Your goal is to write a description that entices customers to purchase the product.

Generate a detailed and engaging product description based on the following information:

Product Name: {{{productName}}}

{{#if keyFeatures}}
Key Features:
{{#each keyFeatures}}- {{{this}}}
{{/each}}
{{/if}}

{{#if attributes}}
Attributes:
{{#each attributes}}- {{{this}}}
{{/each}}
{{/if}}

Your description should highlight the benefits, appeal to the target audience, and be persuasive. Ensure it is well-structured and easy to read. Focus on creating a unique description that sounds natural and not generic.`,
});

const aiProductDescriptionGeneratorFlow = ai.defineFlow(
  {
    name: 'aiProductDescriptionGeneratorFlow',
    inputSchema: AIProductDescriptionGeneratorInputSchema,
    outputSchema: AIProductDescriptionGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
