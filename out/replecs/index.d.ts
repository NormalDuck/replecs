import type { Entity, Tag } from "@rbxts/jecs";
import type { ObserverWorld } from "@rbxts/jecs-addons";

// -------- Utility -------------
type CapitalizeWord<S extends string> = S extends `${infer First}${infer Rest}`
    ? `${Uppercase<First>}${Lowercase<Rest>}`
    : S;

type SnakeToPascal<S extends string> = S extends `${infer Head}_${infer Tail}`
    ? `${CapitalizeWord<Head>}${SnakeToPascal<Tail>}`
    : CapitalizeWord<S>;

type PascalCaseKeys<T> = {
    [K in keyof T as SnakeToPascal<K & string>]: T[K];
};

// -------- Replecs -----------

declare namespace Replecs {
    export interface SerdesTable {
        serialize: (value: any) => buffer;
        deserialize: (buffer: buffer) => any;
    }

    type MemberFilter = Map<Player, boolean>;

    export interface Components {
        shared: Tag;
        networked: Entity<MemberFilter | undefined>;
        reliable: Entity<MemberFilter | undefined>;
        unreliable: Entity<MemberFilter | undefined>;
        pair: Tag;

        serdes: Entity<SerdesTable>;
        bytespan: Entity<number>;
        custom_id: Entity<(value: any) => Entity>;
        __alive_tracking__: Tag;
    }

    export interface Client {
        world: ObserverWorld;
        inited?: boolean;

        init(world?: ObserverWorld): void;
        destroy(): void;
        after_replication(callback: () => void): void;

        apply_updates(buf: buffer, all_variants?: any[][]): void;
        apply_unreliable(buf: buffer, all_variants?: any[][]): void;
        apply_full(buf: buffer, all_variants?: any[][]): void;
    }

    export interface Server {
        world: ObserverWorld;
        inited?: boolean;

        init(world?: ObserverWorld): void;
        destroy(): void;

        get_full(player: Player): LuaTuple<[buffer, any[][]]>;
        collect_updates(): () => LuaTuple<[Player, buffer, any[][]]>;
        collect_unreliable(): () => LuaTuple<[Player, buffer, any[][]]>;
        mark_player_ready(player: Player): void;
        is_player_ready(player: Player): boolean;
    }

    export interface Replecs extends Components, PascalCaseKeys<Components> {
        client: Client;
        server: Server;

        after_replication(world: ObserverWorld): void;

        create_server(world: ObserverWorld | undefined): Server;
        create_client(world: ObserverWorld | undefined): Client;
        create(world: ObserverWorld | undefined): Replecs;
    }
}

declare const Replecs: Replecs.Replecs;

export = Replecs;
