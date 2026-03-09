/**
 * One-way cryptographic hashing function using SHA-256.
 * This is used for secure password verification and other one-way data protections.
 */
export async function hashInput(input: string): Promise<string> {
    const utf8 = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
