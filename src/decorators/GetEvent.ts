import { CementoContract } from '../core/CementoContract';

export function _GetEvent(name: string, contract: CementoContract) {
    return contract.getEvent(name);        
}

/**
 * Annotates a Connex thor.event
 * @param options props
 */
export function GetEvent(options?: { name: string }) {
    return (
        target: any,
        propertyKey: string
    ) => {
        const getEvent = function() {
            const self = this as CementoContract;
            return self.getEvent(
                options.name || propertyKey
            );
        };
        
        Object.defineProperty(target, propertyKey, {
            value: getEvent,
            enumerable: false,
            configurable: true
        });
    };
}