import { ContractImport, CementoProviderType } from '../types';
import { TopicSignature } from './TopicSignature';
import { _Read, _Write, _GetEvent } from '../decorators';


/**
 * A provider is a plugin to use contract entities with a blockchain. The main task of a provider is to load up the Solidity ABI definition
 * and enable any auto generated helpers or methods.
 */
export abstract class CementoProvider {
    public topics: { [key: string]: TopicSignature };
    public methods: { [key: string]: any };
    public events: { [key: string]: any };
    protected abi: any[];
    protected contractImport: ContractImport;
    protected providerType: CementoProviderType;

    public abstract getProviderType(): CementoProviderType;

    protected buildDynamicStubs(): void {
        if (this.abi.length > 0) {
            const contract: any = this;
            this.methods = {};
            this.events = {};
            // Add Read, Writes
            this.abi.forEach(definition => {
                if (definition.type === 'function' && (
                    definition.stateMutability === 'view' ||
                    definition.constant)) {
                    this.methods = {
                        ...this.methods,
                        [definition.name]: (...req: any[]) => _Read(definition.name, contract, req, {})
                    };
                }
                if (definition.type === 'function' && (
                    definition.stateMutability === 'nonpayable' ||
                    !definition.constant)) {
                    this.methods = {
                        ...this.methods,
                        [definition.name]: (...req: any[]) => _Write(definition.name, contract, req, {})
                    };
                }
                if (definition.type === 'event') {
                    this.events = {
                        ...this.events,
                        [definition.name]: () => _GetEvent(definition.name, contract)
                    }
                }
            });
        }
    }

    protected setContractImport(contractImport: ContractImport): void {
        this.abi = contractImport.raw.abi as any;
        this.contractImport = contractImport;

        // Add topics
        this.abi.forEach(definition => {
            if (definition.type === 'event' && definition.signature) {
                const topic = new TopicSignature(definition.signature);
                this.topics = {
                    ...this.topics,
                    [definition.name]: topic
                };
            }
        });
    }
}
