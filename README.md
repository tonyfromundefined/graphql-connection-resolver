# 🔗 GraphQL Connection Resolver
[![](https://img.shields.io/npm/v/graphql-connection-resolver)](https://www.npmjs.com/package/graphql-connection-resolver)
[![](https://img.shields.io/bundlephobia/min/graphql-connection-resolver)](https://bundlephobia.com/result?p=graphql-connection-resolver)

Helps to easily implement the relay connection specification (inspired by [Nexus.js Connection Plugin](https://nexus.js.org/docs/plugin-connection))

## What is the `Connection`?
- [GraphQL Cursor Connection Specification](https://relay.dev/graphql/connections.htm)

## Install

```bash
$ yarn add graphql-connection-resolver
```

## Example
### Schema
```graphql
scalar DateTime

type Query {
  chatRoom(id: String!): ChatRoom
}

type ChatRoom {
  id: ID!

  # if messages empty, returns null
  messages(
    first: Int
    last: Int
    before: Int
    after: Int
  ): ChatMessageConnection!
}

type ChatMessage {
  id: ID!
  createdAt: DateTime!
}

type ChatMessageConnection {
  edges: [ChatMessageEdge!]!
  pageInfo: PageInfo!
}

type ChatMessageEdge {
  node: ChatMessage!
  cursor: String!
}

type PageInfo {
  hasPreviousPage: Boolean!
  hasNextPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### Resolver

```typescript
import { connection } from 'graphql-connection-resolver'

export const ChatRoom = {
  messages: connection({
    /**
     * returns a list of the model with `parent`, `args`, `ctx`
     * You must request one more than given by first and last.
     * Inside the library, if nodes return the same number as the given `first` or `last`, the next page is considered to not exist.
     * and if nodes return more than the given number, the next page is considered to exist.
     */
    async nodes(parent, args, ctx) {
      return [
        /* ... */
      ]
    },

    /**
     * Extract a string to be used as a cursor from node.
     * It automatically performs base64 encoding and decoding inside,
     * so just return plain text.
     */ 
    cursorFromNode(node) {
      return node.createdAt.toISOString()
    },
  }),
}
```

## Note
- You must request one more than given by first and last. Inside the library, if nodes return the same number as the given `first` or `last`, the next page is considered to not exist, and if nodes return more than the given number, the next page is considered to exist.

  ```typescript
  connection({
    async nodes(args) {
      const items = await fetchItems({
        /* ... */,
        limit: args.first + 1,
      })

      /* ... */
    }
  })
  ```

## References
- [Nexus.js Connection Plugin](https://nexus.js.org/docs/plugin-connection)
- [GraphQL Cursor Connections Specification](https://relay.dev/graphql/connections.htm)

> If you have a feature request or a bug, please create a new issue. And also, pull requests are always welcome 🙏
