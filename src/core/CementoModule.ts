
import { ContractImport, CementoProviderType } from '../types';
import { CementoContract } from './CementoContract';
import { CementoProvider } from '..';

function applyMixins(derivedCtor: any, baseCtors: any[]) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}

export interface ProviderInstance {
    provider: any;
    options: any;
}

export interface ProviderInstances {
    [key: string]: ProviderInstance;
}

export interface ContractProviderMapping {
    name: string;
    import: ContractImport;
    entity?: any;
    provider?: any;
    enableDynamicStubs?: boolean;
}

export interface BindModuleContracts {
    [key: string]: CementoContract & CementoProvider;
}

export interface ConnectedContracts {
    [key: string]: (CementoContract & CementoProvider);
}
/**
 * Contract collection stores the contracts
 */
export class ContractCollection {
    private coll: BindModuleContracts = {};

    add(key: string, c: CementoContract & CementoProvider) {
        this.coll[key] = c;
    }
    getContract<T>(key: string): T & CementoContract & CementoProvider {
        return (this.coll[key] as any) as T &
        CementoContract &
        CementoProvider;
    }
    getDynamicContract(key: string): CementoContract & CementoProvider {
        return this.coll[key];
    }

    /**
     * Connects contracts previously configured in bindContracts
     */
    connect(): ConnectedContracts {
        const contracts = {};
        Object.keys(this.coll).forEach(i => {
            const c = (this.coll[i] as CementoContract);
            c.connect();
            contracts[i] = c;
        })
        return contracts;
    }
}

class Empty { }

/**
 * A Cemento Module binds a contract entity to Cemento Decorators using mixins
 */
export class CementoModule {
    providers: CementoProvider[];
    bindSetupOptions: ProviderInstances;

    constructor(private contractMappings: ContractProviderMapping[], ...providers: any[]) {
        this.providers = providers;
    }

    /**
     * Adds a contract to a cemento module
     */
    addContractMapping(contractProviderMapping: ContractProviderMapping) {
        this.contractMappings.push(contractProviderMapping);
    }

    /**
     * Rebind
     */
    rebind() {
        if (this.bindSetupOptions) {
            this.bindContracts(this.bindSetupOptions);
        } else {
            throw new Error('bindContracts must have been called previously');
        }
    }

    /**
     * Bind contracts
     * @param setupOptions provider setup options
     */
    bindContracts(setupOptions?: ProviderInstances): ContractCollection {
        const coll = new ContractCollection();

        // if one contract mapping exists
        // and multiple providers
        // use short module syntax
        if (this.contractMappings.length === 1 && this.providers.length > 0) {
            const c = this.contractMappings[0];
            this.providers.forEach((provider) => {
                const name = c.name;
                if (!name) {
                    throw new Error('Must have a name for short module syntax');
                }
                this.bindContract(provider, c, coll, true, setupOptions);
            })
        } else {
            this.contractMappings.map((c) => {
                let provider = c.provider;
                this.bindContract(provider, c, coll, false, setupOptions);
            });
        }

        this.bindSetupOptions = setupOptions;
        return coll;
    }


    /**
     * Binds and configures a contract
     * @param provider Plugin provider type
     * @param c Contract mapping
     * @param collection Contract collection
     * @param generateName If true, generates a name
     * @param setupOptions Provider instance config
     */
    private bindContract(provider: any, c: ContractProviderMapping, collection: ContractCollection, generateName: boolean, setupOptions?: ProviderInstances) {
        if (!provider) {
            throw new Error(`Missing provider for ${c.name}`);
        }
        if (!c && c.import) {
            throw new Error(`Missing import for ${c.name}`);
        }
        // if no entity is added and dynamic, use an empty class
        if (!c.entity && c.enableDynamicStubs) {
            c.entity = Empty;
        }

        if (!c.entity && !c.enableDynamicStubs) {
            throw new Error('Must provide an entity class');
        }

        // Creates temp fn to clone prototype
        const init: any = function fn() { }
        init.prototype = Object.create(c.entity.prototype);

        // Apply provider and CementoProvider Plugin to entity type
        applyMixins(init, [provider, CementoProvider]);
        const instance = new init();
        instance.setContractImport(c.import);
        if (c.enableDynamicStubs) {
            instance.buildDynamicStubs();
        }

        let name = c.name;
        const providerKeyName = instance.getProviderType();
        const providerName = CementoProviderType[providerKeyName];
        if (generateName) {
            name = `${providerName}${c.name}`;
        }
        const contract = instance as CementoContract & CementoProvider;
        collection.add(name, contract);

        if (setupOptions) {
            // find provider instance options
            const instanceOptions = setupOptions[providerKeyName];
            if (instanceOptions) {
                contract.setInstanceOptions(instanceOptions);
            }
        }
    }
}
