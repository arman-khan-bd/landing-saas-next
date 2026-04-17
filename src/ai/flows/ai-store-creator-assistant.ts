'use server';
/**
 * @fileOverview An AI assistant for generating creative store names and descriptions.
 *
 * - aiStoreCreatorAssistant - A function that suggests store names and descriptions.
 * - StoreCreatorAssistantInput - The input type for the aiStoreCreatorAssistant function.
 * - StoreCreatorAssistantOutput - The return type for the aiStoreCreatorAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StoreCreatorAssistantInputSchema = z.object({
  businessType: z.string().describe('The type of business the store will be (e.g., handmade jewelry, organic pet food, vintage clothing).'),
  targetAudience: z.string().describe('The target audience for the store (e.g., eco-conscious millennials, luxury pet owners, fashion-forward Gen Z).')
});
export type StoreCreatorAssistantInput = z.infer<typeof StoreCreatorAssistantInputSchema>;

const StoreCreatorAssistantOutputSchema = z.object({
  suggestedStores: z.array(
    z.object({
      name: z.string().describe('A creative, unique, and catchy name for the e-commerce store.'),
      description: z.string().describe('A brief, compelling, and brand-aligned description for the e-commerce store, appealing to the target audience.')
    })
  ).describe('An array of suggested store names and descriptions, each representing a unique branding concept.')
});
export type StoreCreatorAssistantOutput = z.infer<typeof StoreCreatorAssistantOutputSchema>;

export async function aiStoreCreatorAssistant(input: StoreCreatorAssistantInput): Promise<StoreCreatorAssistantOutput> {
  return aiStoreCreatorAssistantFlow(input);
}

const aiStoreCreatorAssistantPrompt = ai.definePrompt({
  name: 'aiStoreCreatorAssistantPrompt',
  input: {schema: StoreCreatorAssistantInputSchema},
  output: {schema: StoreCreatorAssistantOutputSchema},
  prompt: `You are a highly creative branding and marketing assistant specializing in e-commerce. Your task is to generate unique and compelling store names along with brief, engaging descriptions. These suggestions should align with the provided business type and target audience, focusing on establishing a strong brand identity.

Generate 3-5 distinct suggestions. Ensure the names are catchy and the descriptions highlight the store's unique selling points and appeal to the specified target audience.

Business Type: {{{businessType}}}
Target Audience: {{{targetAudience}}}`
});

const aiStoreCreatorAssistantFlow = ai.defineFlow(
  {
    name: 'aiStoreCreatorAssistantFlow',
    inputSchema: StoreCreatorAssistantInputSchema,
    outputSchema: StoreCreatorAssistantOutputSchema
  },
  async (input) => {
    const {output} = await aiStoreCreatorAssistantPrompt(input);
    return output!;
  }
);
