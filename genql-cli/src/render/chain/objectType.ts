import {
    getNamedType,
    GraphQLInterfaceType,
    GraphQLNamedType,
    GraphQLObjectType,
    isEnumType,
    isListType,
    isNonNullType,
    isScalarType,
    isUnionType,
    GraphQLFieldMap,
} from 'graphql'
import { fieldComment, typeComment } from '../common/comment'
import { RenderContext } from '../common/RenderContext'
import { renderTyping } from '../common/renderTyping'
import { toArgsString } from '../common/toArgsString'
import { requestTypeName } from '../requestTypes/requestTypeName'
import { RUNTIME_LIB_NAME } from '../../config'
import { sortKeys } from '../common/support'

export const chainTypeName = (
    type: GraphQLNamedType,
    wrapper: 'Promise' | 'Observable',
) => {
    return `${type.name}${wrapper}Chain`
}

export const objectType = (
    type: GraphQLObjectType | GraphQLInterfaceType,
    ctx: RenderContext,
    wrapper: 'Promise' | 'Observable',
) => {
    // console.log(Object.keys(type.getFields()))
    const fieldsMap: GraphQLFieldMap<any, any> = ctx.config?.sortProperties
        ? sortKeys(type.getFields())
        : type.getFields()

    const fieldStrings = Object.keys(fieldsMap).map((fieldName) => {
        const field = fieldsMap[fieldName]
        const resolvedType = getNamedType(field.type)
        const stopChain =
            isListType(field.type) ||
            (isNonNullType(field.type) && isListType(field.type.ofType)) ||
            isUnionType(resolvedType)
        const resolvable = !(
            isEnumType(resolvedType) || isScalarType(resolvedType)
        )
        const argsPresent = field.args.length > 0
        const argsOptional = !field.args.find((a) => isNonNullType(a.type))
        const argsString = toArgsString(field)

        const executeReturnType = renderTyping(field.type, false, false, false)
        const executeReturnTypeWithTypeMap = renderTyping(
            field.type,
            false,
            false,
            false,
            (x: string) => x, // `FieldsSelection<${x}, R>`,
        )

        // get: <R extends CreateOneOrderPayloadRequest>(
        //     request: R,
        //     defaultValue?: CreateOneOrderPayload | null,
        //   ) => Promise<FieldsSelection<CreateOneOrderPayload, R>  | null>

        const getFnType = `{get: (request: ${requestTypeName(
            resolvedType,
        )}, defaultValue?:${executeReturnTypeWithTypeMap})=>${wrapper}<${executeReturnTypeWithTypeMap}>}`
        const fieldType = resolvable
            ? stopChain
                ? getFnType
                : `${chainTypeName(resolvedType, wrapper)} & ${getFnType}`
            : `{get:(request?:boolean|number,defaultValue?:${executeReturnType})=>${wrapper}<${executeReturnType}>}`

        const result: string[] = []

        if (argsPresent) {
            result.push(
                `((args${
                    argsOptional ? '?' : ''
                }:${argsString})=>${fieldType})`,
            )
        }

        if (!argsPresent || argsOptional) {
            result.push(`(${fieldType})`)
        }

        return `${fieldComment(field)}${field.name}:${result.join('&')}`
    })

    ctx.addImport(RUNTIME_LIB_NAME, false, 'FieldsSelection', true, true)

    if (wrapper === 'Observable') {
        ctx.addImport(RUNTIME_LIB_NAME, false, 'Observable', true, true)
    }

    ctx.addCodeBlock(
        `${typeComment(type)}export interface ${chainTypeName(
            type,
            wrapper,
        )}{${fieldStrings.join(',')}}`,
    )
}
