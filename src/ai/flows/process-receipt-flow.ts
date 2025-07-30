
'use server';
/**
 * @fileOverview Un flujo de IA para procesar facturas y otorgar estrellas basadas en productos participantes.
 *
 * - processReceipt - Procesa una imagen de una factura y devuelve las estrellas otorgadas.
 * - ProcessReceiptInput - El tipo de entrada para la función processReceipt.
 * - ProcessReceiptOutput - El tipo de retorno para la función processReceipt.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define el esquema de entrada con una descripción clara para el Data URI
const ProcessReceiptInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Una foto de una factura, como un data URI que debe incluir un tipo MIME y usar codificación Base64. Formato esperado: 'data:<mimetype>;base64,<datos_codificados>'."
    ),
  productName: z.string().describe('El nombre del producto que el usuario afirma haber comprado.'),
  quantity: z.number().describe('La cantidad del producto que el usuario afirma haber comprado.'),
  starsPerProduct: z.number().describe('Las estrellas que se otorgan por cada unidad del producto.'),
});
export type ProcessReceiptInput = z.infer<typeof ProcessReceiptInputSchema>;

// Define el esquema de salida
const ProcessReceiptOutputSchema = z.object({
  starsAwarded: z.number().describe('El número total de estrellas otorgadas por la compra. Si la validación falla, debe ser 0.'),
  reason: z.string().describe('Una breve explicación de por qué se otorgaron o no las estrellas.'),
});
export type ProcessReceiptOutput = z.infer<typeof ProcessReceiptOutputSchema>;

/**
 * Función exportada que los componentes de cliente llamarán.
 * @param input La entrada que contiene la foto, el producto y la cantidad.
 * @returns Una promesa que se resuelve con las estrellas otorgadas.
 */
export async function processReceipt(input: ProcessReceiptInput): Promise<ProcessReceiptOutput> {
  return processReceiptFlow(input);
}

// Define el prompt que se enviará al modelo de IA
const prompt = ai.definePrompt({
  name: 'processReceiptPrompt',
  input: {schema: ProcessReceiptInputSchema},
  output: {schema: ProcessReceiptOutputSchema},
  prompt: `Eres un auditor experto en el programa de lealtad de StarCart. Tu tarea es verificar la información de una factura que un usuario ha subido para ganar estrellas.

  **Instrucciones de Auditoría:**
  1.  El usuario ha declarado que compró '{{quantity}}' unidad(es) del producto '{{productName}}'.
  2.  Analiza cuidadosamente la imagen de la factura proporcionada.
  3.  **Verifica la coincidencia:** Confirma si el nombre del producto '{{productName}}' y la cantidad '{{quantity}}' aparecen claramente en la factura. El reconocimiento del nombre debe ser exacto o muy similar (ej. "ANSIOLIFE" coincide con "Ansiolife 20mg").
  4.  **Toma una decisión:**
      - **Si la información coincide:** Otorga las estrellas correspondientes. El cálculo es: ({{quantity}} * {{starsPerProduct}}). En la razón, indica que la validación fue exitosa.
      - **Si la información NO coincide o no es legible:** Otorga 0 estrellas. En la razón, explica brevemente por qué falló la validación (ej. "El producto no aparece en la factura", "La cantidad no coincide", o "La imagen no es legible").
  
  **Datos proporcionados por el usuario:**
  - Producto: {{productName}}
  - Cantidad: {{quantity}}
  - Estrellas por producto: {{starsPerProduct}}

  **Imagen de la factura para analizar:**
  {{media url=photoDataUri}}`,
});

// Define el flujo principal de Genkit
const processReceiptFlow = ai.defineFlow(
  {
    name: 'processReceiptFlow',
    inputSchema: ProcessReceiptInputSchema,
    outputSchema: ProcessReceiptOutputSchema,
  },
  async (input) => {
    // Llama al prompt de la IA con la imagen y los datos de entrada.
    const { output } = await prompt(input);
    if (!output) {
      return { starsAwarded: 0, reason: 'Error interno al procesar la factura.' };
    }
    return output;
  }
);
