import { IBuilder } from "./IBuilder";

export interface IDefaultBuilder {
    /**
     * @returns a builder with nice preset defaults
     */
    defaultBuilder(): IBuilder<any> | Promise<IBuilder<any>>;
}