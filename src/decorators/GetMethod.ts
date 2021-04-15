import { CementoContract } from '../core/CementoContract';

/**
 * Annotates a Cemento get method
 * @param options props
 */
export function GetMethod(options: { name: string }) {
    return (
        target: any,
        propertyKey: string
    ) => {
        const getMethod = function() {
            const self = this as CementoContract;
            return self.getMethod(
                options.name || propertyKey
            );
        };
        
        Object.defineProperty(target, propertyKey, {
            value: getMethod,
            enumerable: false,
            configurable: true
        });
    };
}
