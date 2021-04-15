export interface CementoTopic {
    get(): any | any[];
    or(arg1: any, arg2?: any): CementoTopic;
    and(arg1: any, arg2?: any): CementoTopic;
    topic(arg1: any, arg2?: any): CementoTopic;
}