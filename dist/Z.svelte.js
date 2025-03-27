import { Zero } from '@rocicorp/zero';
// This is the state of the Zero instance
// You can reset it on login or logout
export class Z {
    current = $state(null);
    constructor(z_options) {
        this.build(z_options);
    }
    build(z_options) {
        // Create new Zero instance
        this.current = new Zero(z_options);
    }
    close() {
        this.current.close();
    }
}
