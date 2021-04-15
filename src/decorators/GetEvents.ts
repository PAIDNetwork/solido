import { EventFilter, EventFilterOptions } from '../types';
import { CementoContract } from '../core/CementoContract';
/**
 * Annotates a Get events call
 * 
 * @param options An EventFilter<T> props
 */
export function GetEvents<P, T>(options: EventFilterOptions<T>) {
    return (
        target: any,
        propertyKey: string
    ) => {
        const getEventsCall = function(fnOptions?: EventFilter<T>) {
            const self = this as CementoContract;
            
            const callOptions = {
                ...options,
                ...fnOptions,
                name: options.name // the name should come from the initial options
            };

            return self.getEvents<P, T>(
                options.name || propertyKey,
                callOptions
            );
        };
        
        Object.defineProperty(target, propertyKey, {
            value: getEventsCall,
            enumerable: false,
            configurable: true
        });
    };
}