import { Decoder, Stream } from '@garmin/fitsdk';

/**
 * Parses a FIT file from a Uint8Array.
 * @param bytes The FIT file bytes to parse.
 * @returns The parsed FIT data.
 */
export function parseFitBytes(bytes: Uint8Array) {
  const stream = Stream.fromByteArray(bytes);
  console.log('Stream created from bytes:', stream);

  if (!Decoder.isFIT(stream)) {
    throw new Error('Not a valid FIT file');
  }

  const decoder = new Decoder(stream);
  if (!decoder.checkIntegrity()) {
    throw new Error('FIT file failed integrity check');
  }

  const { messages, errors } = decoder.read();
  if (errors.length) console.warn('FIT parse warnings:', errors);

  return messages;
}

/**
 * Converts a FIT file to a Uint8Array for parsing.
 * @param file The FIT file to parse.
 * @returns A promise that resolves to the parsed messages.
 */
export async function parseFitFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return parseFitBytes(new Uint8Array(arrayBuffer));
}