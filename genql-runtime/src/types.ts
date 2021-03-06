export interface ExecutionResult<TData = { [key: string]: any }> {
    errors?: ReadonlyArray<Error>
    // TS_SPECIFIC: TData. Motivation: https://github.com/graphql/graphql-js/pull/2490#issuecomment-639154229
    data?: TData | null
}

// TYPE MAP ////////////
// the type of types.json object

export interface ArgMap<keyType = number> {
    [arg: string]: [keyType, string] | [keyType] | undefined
}

export interface Field<keyType = number> {
    type: keyType
    args?: ArgMap<keyType>
}

// export type Field = [string] | [string, ArgMap]

export interface FieldMap<keyType = number> {
    [field: string]: Field<keyType> | undefined
}

export type Type<keyType = number> = FieldMap<keyType>

export interface TypeMap<keyType = number> {
    scalars: Array<keyType>
    types: {
        [type: string]: Type<keyType> | undefined
    }
}

// LINKED TYPE ////////////

export interface LinkedArgMap {
    [arg: string]: [LinkedType, string] | undefined
}
export interface LinkedField {
    type: LinkedType
    args?: LinkedArgMap
}

export interface LinkedFieldMap {
    [field: string]: LinkedField | undefined
}

export interface LinkedType {
    name: string
    fields?: LinkedFieldMap
    scalar?: string[]
}

export interface LinkedTypeMap {
    [type: string]: LinkedType | undefined
}
