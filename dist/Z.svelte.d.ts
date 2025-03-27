import { Zero, type Schema, type ZeroOptions } from '@rocicorp/zero';
export declare class Z<TSchema extends Schema> {
    current: Zero<TSchema>;
    constructor(z_options: ZeroOptions<TSchema>);
    build(z_options: ZeroOptions<TSchema>): void;
    close(): void;
}
