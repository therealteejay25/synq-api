export interface IToolService {
    connect(authData: any): Promise<void>;
    disconnect(): Promise<void>;
    performAction(action:string, payload: any): Promise<any>;
    sync(): Promise<any>;
    getActivity(): Promise<any>;
}