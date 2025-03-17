import { IBuilder } from "./IBuilder";
import { UnimplementedError } from "../errors";

export interface IDefaultBuilder {
    /**
     * @returns a builder with nice preset defaults
     */
    defaultBuilder<T extends IDefaultBuilder>(): IBuilder<T>;
}