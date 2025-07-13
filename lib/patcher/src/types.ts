export type FiniteDomain<Key extends PropertyKey> = unknown extends (
    Key extends unknown
        ? object extends Record<Key, unknown>
            ? unknown
            : never
        : never
)
    ? never
    : Key

export type UnknownFunction = Callable | AbstractNewable

export type Callable<
    This = never,
    Args extends readonly unknown[] = never,
    Return = unknown,
> = (this: This, ...args: Args) => Return

export type AbstractNewable<
    Args extends readonly unknown[] = never,
    Return = unknown,
> = abstract new (...args: Args) => Return

export type ConcreteNewable<
    Args extends readonly unknown[] = never,
    Return = unknown,
> = new (...args: Args) => Return

export type UnionToIntersection<Union> = (
    Union extends unknown
        ? (arg: Union) => unknown
        : never
) extends (arg: infer Intersection) => unknown
    ? Intersection & Union
    : never

export type BeforeHook<T extends UnknownFunction = UnknownFunction> =
    OverloadUnion<T> extends infer U
        ? 0 extends 1 & U
            ? (args: any) => any
            : UnionToIntersection<
                  U extends Callable<never, infer Args>
                      ? (args: Args) => Args
                      : U extends ConcreteNewable<infer Args>
                        ? (args: Args) => Args
                        : never
              >
        : never

export type InsteadHook<T extends UnknownFunction = UnknownFunction> =
    OverloadUnion<T> extends infer U
        ? 0 extends 1 & U
            ?
                  | ((this: any, args: any[], originalFunction: T) => any)
                  | (abstract new (
                        args: any[],
                        originalFunction: T,
                    ) => any)
            : UnionToIntersection<
                  U extends Callable<infer This, infer Args, infer Return>
                      ? (this: This, args: Args, originalFunction: T) => Return
                      : U extends ConcreteNewable<infer Args, infer Return>
                        ? abstract new (
                              args: Args,
                              originalFunction: T,
                          ) => Return
                        : never
              >
        : never

export type AfterHook<T extends UnknownFunction = UnknownFunction> =
    OverloadUnion<T> extends infer U
        ? 0 extends 1 & U
            ? (result: any) => any
            : UnionToIntersection<
                  U extends Callable<never, never, infer Return>
                      ? (result: Return) => Return
                      : U extends ConcreteNewable<never, infer Return>
                        ? (result: Return) => Return
                        : never
              >
        : never

/** @see {@link https://github.com/microsoft/TypeScript/issues/32164#issuecomment-1146737709} */
export type OverloadUnion<
    Overload extends UnknownFunction,
    PartialOverload = OmitOverloads<Overload>,
> = 0 extends 1 & Overload
    ? any
    : Overload extends Callable<infer CThis, infer CArgs, infer CReturn>
      ? Overload extends AbstractNewable<infer NArgs, infer NReturn>
          ? OverloadUnionCallableNewable<
                Overload,
                PartialOverload,
                Callable<CThis, CArgs, CReturn>,
                ConcreteNewable<NArgs, NReturn>
            >
          : OverloadUnionCallable<
                Overload,
                PartialOverload,
                Callable<CThis, CArgs, CReturn>
            >
      : Overload extends AbstractNewable<infer NArgs, infer NReturn>
        ? OverloadUnionNewable<
              Overload,
              PartialOverload,
              ConcreteNewable<NArgs, NReturn>
          >
        : never

export type OmitOverloads<T> = { [Key in keyof T]: T[Key] }

export type OverloadUnionCallableNewable<
    Overload extends Callable & AbstractNewable,
    PartialOverload,
    CurrentCallable extends Callable,
    CurrentNewable extends ConcreteNewable,
> =
    | OverloadUnionCallableNewableInner<
          CurrentCallable & CurrentNewable & Overload,
          CurrentCallable & CurrentNewable & PartialOverload,
          CurrentCallable & CurrentNewable
      >
    | CurrentCallable
    | CurrentNewable

export type OverloadUnionCallableNewableInner<
    Overload extends Callable & AbstractNewable,
    PartialOverload,
    PreviousOverload extends Callable & ConcreteNewable,
> = PartialOverload extends Overload
    ? never
    : Overload extends Callable<infer CThis, infer CArgs, infer CReturn>
      ? Overload extends AbstractNewable<infer NArgs, infer NReturn>
          ? // Detects infinite recursion caused by generic overloads.
            Callable<CThis, CArgs, CReturn> &
                ConcreteNewable<NArgs, NReturn> extends PreviousOverload
              ? PreviousOverload extends Callable<CThis, CArgs, CReturn> &
                    ConcreteNewable<NArgs, NReturn>
                  ? any
                  : OverloadUnionCallableNewable<
                        Overload,
                        PartialOverload,
                        Callable<CThis, CArgs, CReturn>,
                        ConcreteNewable<NArgs, NReturn>
                    >
              : OverloadUnionCallableNewable<
                    Overload,
                    PartialOverload,
                    Callable<CThis, CArgs, CReturn>,
                    ConcreteNewable<NArgs, NReturn>
                >
          : never
      : never

export type OverloadUnionCallable<
    Overload extends Callable,
    PartialOverload,
    CurrentCallable extends Callable,
> =
    | OverloadUnionCallableInner<
          CurrentCallable & Overload,
          CurrentCallable & PartialOverload,
          CurrentCallable
      >
    | CurrentCallable

export type OverloadUnionCallableInner<
    Overload extends Callable,
    PartialOverload,
    PreviousOverload extends Callable,
> = PartialOverload extends Overload
    ? never
    : Overload extends Callable<infer This, infer Args, infer Return>
      ? // Detects infinite recursion caused by generic overloads.
        Callable<This, Args, Return> extends PreviousOverload
          ? PreviousOverload extends Callable<This, Args, Return>
              ? any
              : OverloadUnionCallable<
                    Overload,
                    PartialOverload,
                    Callable<This, Args, Return>
                >
          : OverloadUnionCallable<
                Overload,
                PartialOverload,
                Callable<This, Args, Return>
            >
      : never

export type OverloadUnionNewable<
    Overload extends AbstractNewable,
    PartialOverload,
    CurrentNewable extends ConcreteNewable,
> =
    | OverloadUnionNewableInner<
          CurrentNewable & Overload,
          CurrentNewable & PartialOverload,
          CurrentNewable
      >
    | CurrentNewable

export type OverloadUnionNewableInner<
    Overload extends AbstractNewable,
    PartialOverload,
    PreviousOverload extends ConcreteNewable,
> = PartialOverload extends Overload
    ? never
    : Overload extends AbstractNewable<infer Args, infer Return>
      ? // Detects infinite recursion caused by generic overloads.
        ConcreteNewable<Args, Return> extends PreviousOverload
          ? PartialOverload extends ConcreteNewable<Args, Return>
              ? any
              : OverloadUnionNewable<
                    Overload,
                    PartialOverload,
                    ConcreteNewable<Args, Return>
                >
          : OverloadUnionNewable<
                Overload,
                PartialOverload,
                ConcreteNewable<Args, Return>
            >
      : never

export type UnpatchFunction = () => void
