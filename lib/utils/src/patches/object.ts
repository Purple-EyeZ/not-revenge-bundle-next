// Retain reference to original functions
export const objectFreeze = Object.freeze

// Patch to prevent the use of Object.freeze
Object.freeze = (o: any) => o
