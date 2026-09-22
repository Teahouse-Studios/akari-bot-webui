# WebUI 后端接口约定（策略内容 / 状态 / 统计 / 配置文件 / WebRender）

本目录的接口为 WebUI 前端提供机器人运行时数据与配置管理能力：

| 实现文件 | 覆盖范围 |
| --- | --- |
| `policy.py` | `data/url_audit` 与 `data/filter_words` 两个可写目录 |
| `api.py` | 状态、统计、配置文件与模块列表等既有 `/api/*` 接口 |
| `webrender.py` | WebRender 的状态查询、启停控制与渲染测试 |


跨进程取数的约定：状态、统计来源与 WebRender 均由**服务端进程**持有。
`bots/web` 是客户端进程，相关字段一律经 JobQueue RPC 取自服务端；
服务端离线时接口只降级对应字段，不影响其余数据。

## 1. 通用约定

- **鉴权**：所有接口都需要 `Authorization: Bearer <JWT>`，与既有 `/api/*` 一致；
  未通过时返回 401。
- **命名**：URL 审计名单的路径参数取值固定为 `allowlist` / `blocklist`，
  过滤词库的路径参数为分类名（即 `data/filter_words/<分类名>.txt` 的文件主干）。
- **只读与可写**：随主仓分发的 `global.txt` 永远只读，接口只写同目录下的
  `user.txt`，即 `data/url_audit/<名单>/user.txt` 与 `data/filter_words/*.txt`。
- **即时生效**：URL 名单由核心按文件元信息判定缓存，写入后立刻生效；
  过滤词库写入后由接口主动触发核心进程重载（RPC `server.reload_filter_words`），
  返回体里的 `runtime_synced` 表示核心是否重载成功，为 `false` 时应提示用户重启机器人。
- **写接口返回 `changed`**：删除或追加一个已存在的对象时不报错，而是返回
  `200` 且 `changed: false`，方便前端做幂等操作（例如重复点击删除）。

### 1.1 版本号（revision）约定

每个可写资源都有版本号，用于「增量同步」与「乐观并发控制」：

- 版本号是 16 位十六进制字符串，由**文件元信息**（文件名、`mtime_ns`、大小）哈希得到；
  文件不存在时为 `missing`。
- 读取响应始终携带 `revision`：
  - `/api/url-audit` → 两份名单的合并版本号；
  - `/api/url-audit/{list}` → 该名单（含 `global.txt` 与 `user.txt`）的版本号；
  - `/api/filter-words` → 词库目录（全部 `*.txt` 的文件集合与元信息）的版本号；
  - 单个分类的版本号见 `category.revision`。
- 读取时可用 `?revision=<上次读到的值>` 做条件请求，未变化时返回 **304** 空响应。
- 写入时可在请求体或查询参数里带上 `revision`：与当前不一致时返回 **409**
  `revision_mismatch`，并在响应头 `X-Policy-Revision` 给出当前版本号；
  调用方重新拉取后再提交即可。不传 `revision` 表示不做并发校验。
- 轮询建议：优先调用轻量的 `GET /api/policy/revision`（只做文件 stat），
  比较 `revision` 变化后再拉取具体内容。

### 1.2 错误码

下表为策略内容接口（第 2、3 章）的原因码；状态、统计、配置文件、模块与 WebRender 接口的
原因码见各自章节。

| 状态码 | `detail` | 含义 |
| --- | --- | --- |
| 400 | `invalid_json` / `invalid_body` | 请求体不是 JSON 对象，或字段类型不符 |
| 401 | - | 未通过 JWT 校验 |
| 404 | `unknown_list` | 名单名不是 `allowlist` / `blocklist` |
| 404 | `category_not_found` | 词库分类文件不存在 |
| 409 | `revision_mismatch` | 版本号已过期，需重新拉取 |
| 422 | URL 规则原因码 | `invalid_url`、`invalid_regex`、`unsafe_regex`、`broad_regex`、`too_many_rules`、`too_many_regex`、`file_too_large` |
| 422 | 词库原因码 | `invalid_category`、`word_too_long`、`too_many_words`、`too_many_categories`、`file_too_large` |

错误码是稳定的机器可读标识，前端应自行本地化展示，不要依赖后端文案。

## 2. URL 审计名单

对应目录：`data/url_audit/allowlist/user.txt`、`data/url_audit/blocklist/user.txt`。
规则写法与 `url-audit` 命令一致：每行一条精确 URL，正则规则以 `regex:` 开头。

### 2.1 读取

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/url-audit` | 两份名单全量（`allowlist` + `blocklist`） |
| `GET` | `/api/url-audit/{list}` | 单份名单 |
| `GET` | `/api/url-audit/query?url=<URL>` | 规则试算：某个 URL 是否被放行/拦截 |

`GET /api/url-audit/allowlist?revision=abc123` 响应示例：

```json
{
  "name": "allowlist",
  "revision": "0f1e2d3c4b5a6978",
  "files": [
    {
      "source": "global", "writable": false, "exists": true,
      "path": "./data/url_audit/allowlist/global.txt",
      "revision": "9a8b7c6d5e4f3210", "size": 128, "updated_at": 1735689600.0,
      "rule_count": 1, "invalid_lines": 0, "ignored": false
    },
    {
      "source": "user", "writable": true, "exists": true,
      "path": "./data/url_audit/allowlist/user.txt",
      "revision": "1234567890abcdef", "size": 64, "updated_at": 1735689700.0,
      "rule_count": 2, "invalid_lines": 0, "ignored": false
    }
  ],
  "rules": [
    {"value": "https://repo.example.test/release", "serialized": "https://repo.example.test/release", "regex": false, "source": "global"},
    {"value": "https://example.test/docs/1", "serialized": "https://example.test/docs/1", "regex": false, "source": "user"},
    {"value": "https://[a-z]+\\.example\\.test/", "serialized": "regex:https://[a-z]+\\.example\\.test/", "regex": true, "source": "user"}
  ],
  "user_rules": ["https://example.test/docs/1", "regex:https://[a-z]+\\.example\\.test/"],
  "limits": {"max_rules": 256, "max_regex_rules": 64, "max_rule_length": 500, "max_url_length": 4096, "max_file_bytes": 65536}
}
```

要点：

- `rules` 是**实际生效**的规则（`global.txt` 与 `user.txt` 合并、去重后的顺序，
  `source` 区分来源）；`user_rules` 是用户文件里的原始顺序，供整体替换时原样回传。
- `invalid_lines` 用于提示手工编辑留下的坏行；`ignored` 表示文件超限而被核心忽略。
- 接口写入不会保留 `user.txt` 中的注释与空行，只保留规则本身。

`GET /api/url-audit/query?url=https://example.test/docs/1` 响应示例：

```json
{
  "url": "https://example.test/docs/1",
  "normalized": "https://example.test/docs/1",
  "valid": true,
  "allowed": true,
  "blocked": false,
  "matches": {"allowlist": [{"value": "https://example.test/docs/1", "serialized": "https://example.test/docs/1", "regex": false, "source": "user"}], "blocklist": []}
}
```

URL 非法时返回 `valid: false` 与 `reason`（如 `invalid_url`），其余字段保持默认值。
判定语义与运行时一致：阻止列表优先，同时命中两份名单时 `blocked` 为 `true`、`allowed` 为 `false`。

### 2.2 写入

| 方法 | 路径 | 请求体 / 参数 |
| --- | --- | --- |
| `POST` | `/api/url-audit/{list}/rules` | `{"value": "https://example.test/", "regex": false, "revision": "…"}` |
| `PUT` | `/api/url-audit/{list}/rules` | `{"rules": ["https://a.test/", "regex:https://[a-z]+\\.test/"], "revision": "…"}` |
| `DELETE` | `/api/url-audit/{list}/rules` | 查询参数 `value`、`regex`（`true` 表示正则）、`revision` |

- `POST` 追加一条规则；`value` 传规则本身，正则**不要**带 `regex:` 前缀，改用 `regex: true`。
- `PUT` 整体替换用户规则文件，逐条校验并去重；`rules` 为空列表即清空用户规则。
  推荐前端直接回传上一次读取到的 `user_rules`，做到幂等的全量同步。
- `DELETE` 只删除用户规则，主仓 `global.txt` 中的规则无法通过接口删除（`changed: false`）。
- 三个写接口都返回该名单的最新完整结构（与 `GET /api/url-audit/{list}` 相同），
  额外多一个 `changed` 字段，前端可据此直接刷新本地状态。

## 3. 过滤词库

对应目录：`data/filter_words/*.txt`。文件名即分类名（`[0-9A-Za-z_-]{1,64}`，
不得超过 64 个文件），命中后机器人把关键词替换为 `[吃掉了:local_<分类名>]`。

### 3.1 读取

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/filter-words` | 全部分类及词条 |
| `GET` | `/api/filter-words/{category}` | 单个分类 |

`GET /api/filter-words` 响应示例：

```json
{
  "revision": "abcdef0123456789",
  "directory": "./data/filter_words",
  "categories": [
    {
      "name": "politics", "label": "local_politics", "file": "politics.txt",
      "count": 2, "words": ["示例词A", "示例词B"],
      "exists": true, "revision": "0123456789abcdef", "size": 18, "updated_at": 1735689700.0
    }
  ],
  "limits": {"max_categories": 64, "max_words_per_category": 20000, "max_word_length": 128, "max_file_bytes": 1048576}
}
```

单分类接口返回同样的 `category` 对象，外层为 `{"revision": "<目录版本号>", "category": {…}}`。

### 3.2 写入

| 方法 | 路径 | 请求体 / 参数 |
| --- | --- | --- |
| `PUT` | `/api/filter-words/{category}` | `{"words": ["词A", "词B"], "revision": "…"}` |
| `DELETE` | `/api/filter-words/{category}` | 查询参数 `revision` |
| `POST` | `/api/filter-words/{category}/words` | `{"words": ["词C"], "revision": "…"}` |
| `DELETE` | `/api/filter-words/{category}/words` | 查询参数 `word`（可重复）、`revision` |

- `PUT` 整体替换分类词条：自动去空白、丢弃空行、按首次出现顺序去重；
  分类不存在时创建；`words` 为空列表即删除该分类文件。
- `POST` 追加词条（分类不存在时创建），与既有词条合并去重，空数组返回 400。
- `DELETE …/words?word=示例词A&word=示例词B` 删除指定词条，返回 `removed` 数量。
- 写入响应形如：

```json
{
  "changed": true,
  "revision": "abcdef0123456789",
  "category": {"name": "politics", "label": "local_politics", "file": "politics.txt", "count": 2, "words": ["示例词A", "示例词B"], "exists": true, "revision": "0123456789abcdef", "size": 18, "updated_at": 1735689700.0},
  "runtime_synced": true
}
```

分类被删除时 `category` 为 `null`、`changed` 为 `true`；对不存在的分类执行删除时
`changed` 为 `false`，接口不返回 404。
