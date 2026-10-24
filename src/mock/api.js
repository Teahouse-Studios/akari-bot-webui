import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

export default function setupMock() {
  const mock = new MockAdapter(axios)

  /** 演示模式下所有写操作统一返回 403，前端会提示「无法在演示模式下修改数据」。 */
  const demoWriteDenied = { detail: 'Cannot edit data in demo mode' }

  /** 演示用 JWT，payload 与后端签发格式保持一致（name / admin / iss）。 */
  const mockJwt =
    'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSm9obiIsImFkbWluIjp0cnVlLCJpc3MiOiJhdXRoLWFwaSJ9.l6piMCKreZU-gjum6VXafyknIUdO8r1NdMP-kcemyJXxD32Chv5LsRDHnD3oUow0qX8vTPeujNgTu6iKLgHe8Q'

  const readJsonBody = (config) => {
    const raw = config.data
    if (raw && typeof raw === 'object') {
      return Array.isArray(raw) ? null : raw
    }
    try {
      const body = JSON.parse(raw || '{}')
      return body && typeof body === 'object' && !Array.isArray(body) ? body : null
    } catch {
      return null
    }
  }

  /** 与后端列表接口一致：默认每页 20 条，上限 100 条。 */
  const paginate = (items, params = {}) => {
    const page = Math.max(1, Number(params.page) || 1)
    const size = Math.min(100, Math.max(1, Number(params.size) || 20))
    const start = (page - 1) * size
    return { total: items.length, items: items.slice(start, start + size) }
  }

  const sse = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

  const stripQuery = (url) => (url || '').split('?')[0]

  mock.onGet('/api').reply(200, { message: 'Hello, AkariBot!' })

  mock.onGet(/^\/api\/media\/[^/]+$/).reply(404, { detail: 'Media not found' })

  mock.onGet('/api/init').reply(200, {
    enable_https: false,
    command_prefix: '~',
    help_url: 'https://bot.teahouse.team',
    locale: 'zh_cn',
    // App.vue 读取的是 `lang`，这里与 `locale` 同时提供以兼容前端实现。
    lang: 'zh_cn',
    heartbeat_interval: 30,
    heartbeat_timeout: 5,
    heartbeat_attempt: 3,
  })

  mock.onGet('/api/verify').reply(200, {
    payload: {
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      iat: Math.floor(Date.now() / 1000),
      iss: 'auth-api',
    },
  })

  // 后端在未设置密码时直接返回 JWT（200），设置密码后才要求 password / TOTP。
  mock.onPost('/api/login').reply(200, { data: mockJwt })

  mock.onGet('/api/password').reply(200, { have_password: false })
  mock.onPut('/api/password').reply(403, demoWriteDenied)
  mock.onDelete('/api/password').reply(403, demoWriteDenied)

  mock.onGet('/api/totp').reply(200, { enabled: false })
  mock.onPost('/api/totp/setup').reply(403, demoWriteDenied)
  mock.onPost('/api/totp/enable').reply(403, demoWriteDenied)
  mock.onPost('/api/totp/backup-codes/reset').reply(403, demoWriteDenied)
  mock.onPost('/api/totp/disable').reply(403, demoWriteDenied)

  // 演示模式不开放开发者模式；其余 /api/dev/* 接口前端不会调用。
  mock.onGet('/api/dev').reply(200, { is_dev: false })

  mock.onGet('/api/server-info').reply(200, {
    os: {
      system: 'Linux',
      version: '#42~22.04.3-Ubuntu SMP Fri Aug 15 10:23:45 UTC 2025',
      machine: 'x86_64',
      boot_time: Math.floor(Date.now() / 1000) - 42314,
    },
    bot: {
      started_time: Math.floor(Date.now() / 1000) - 42314,
      python_version: '3.12.8',
      version: 'badf00d',
      web_render_status: true,
      jobqueue_backend: 'websocket',
      command_parsed: 1234,
      message_parsed: 5678,
    },
    cpu: {
      cpu_brand: 'AMD EPYC 9654',
      cpu_percent: 11.4,
    },
    memory: {
      total: 65536,
      used: 33685.5,
      percent: 51.4,
    },
    disk: {
      total: 1024,
      used: 829.4,
      percent: 81.0,
    },
    processes: {
      items: [
        { name: 'Server', pid: 101, memory: 314572800, metric: 'USS', threads: 24 },
        { name: 'daemon', pid: 100, memory: 52428800, metric: 'RSS', threads: 3 },
        { name: 'jobqueue-hub', pid: null, memory: 20971520, metric: 'RSS', threads: 2 },
        { name: 'QQ', pid: 118, memory: 187904819, metric: 'RSS', threads: 12 },
        { name: 'Discord', pid: 124, memory: 96468992, metric: 'RSS', threads: 9 },
      ],
      failures: [{ name: 'Telegram', reason: 'timeout' }],
      error: null,
    },
  })

  const mockAnalyticsModules = [
    'wiki',
    'ai',
    'ping',
    'help',
    'search',
    'translate',
    'meme',
    'petal',
    '',
  ]
  const mockPlatforms = ['QQ', 'Discord', 'Telegram', 'Web']
  const mockCommands = ['help', 'ping', 'wiki', 'ai', 'meme', 'petal', 'translate', 'dice']

  // 伪随机：同一 days 下生成稳定的演示数据
  const pseudoRandom = (seed) => {
    const value = Math.sin(seed) * 10000
    return value - Math.floor(value)
  }

  const buildAnalyticsRecords = (days) => {
    const windowMs = days * 24 * 60 * 60 * 1000
    const now = Date.now()
    const total = Math.min(600, Math.max(24, days * 12))
    const records = []

    for (let i = 0; i < total; i += 1) {
      const seed = i + days
      const timestamp = new Date(now - windowMs * pseudoRandom(seed * 1.37))
      records.push({
        id: i + 1,
        module_name:
          mockAnalyticsModules[Math.floor(pseudoRandom(seed * 2.11) * mockAnalyticsModules.length)],
        module_type: 'normal',
        target_id: `${mockPlatforms[Math.floor(pseudoRandom(seed * 3.07) * mockPlatforms.length)]}|Console|0`,
        sender_id: 'Web|0',
        target_union_id: null,
        sender_union_id: null,
        command: mockCommands[Math.floor(pseudoRandom(seed * 5.53) * mockCommands.length)],
        timestamp: timestamp.toISOString().replace('Z', '000+00:00'),
      })
    }

    return records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }

  mock.onGet('/api/analytics').reply((config) => {
    const days = Math.max(1, Number(config.params?.days) || 1)
    const data = buildAnalyticsRecords(days)

    return [
      200,
      {
        count: data.length,
        change_rate: 0.25,
        data,
      },
    ]
  })

  mock.onGet('/api/analytics/modules').reply((config) => {
    const days = Math.max(1, Number(config.params?.days) || 1)
    const records = buildAnalyticsRecords(days)

    const countByModule = new Map()
    records.forEach((record) => {
      countByModule.set(record.module_name, (countByModule.get(record.module_name) || 0) + 1)
    })

    const modules = [...countByModule.entries()]
      .map(([module_name, count]) => ({
        module_name,
        count,
        percent: Math.round((count / records.length) * 10000) / 100,
      }))
      .sort((a, b) => b.count - a.count || a.module_name.localeCompare(b.module_name))

    return [
      200,
      {
        days,
        count: records.length,
        change_rate: 0.25,
        total_modules: modules.length,
        modules,
      },
    ]
  })

  mock.onGet('/api/config').reply(200, {
    cfg_files: ['config.toml', 'bot_web.toml', 'module_wiki.toml', 'module_petal.toml'],
  })

  mock.onGet('/api/config/config.toml').reply(200, {
    content:
      '# https://toml.io/cn/v1.0.0\n# 注意：TOML 不是 Python。请不要在此处使用 Python 语法。\n# 例如：TOML 中的布尔值必须是小写。\n\ndefault_locale = "zh_cn" # 默认的会话语言环境。\nconfig_version = 2 # 配置版本号，将会随功能更新自增，一般情况请勿修改。\ninitialized = true\n\n[config]\n# 一些基础的配置部分，此处填写的值可在消息中以明文形式展示。请不要在此部分填写敏感信息。\nenable_dirty_check = false # 是否启用文字过滤检测，需要配置阿里云内容安全服务的 AccessKey ID 与 AccessKey Secret。\nenable_urlmanager = true # 是否启用 URLManager，用于 URL 跳板用。（声明此 URL 非官方链接等）\nenable_tos = true # 是否启用内置的 ToS 检查规则。\nignored_sender = ["QQ|2854196310"] # 无视的用户列表，匹配到此列表中的用户将会被忽略。\nissue_url = "https://github.com/Teahouse-Studios/bot/issues/new/choose" # 问题反馈网址。\nenable_petal = false # 是否启用花瓣功能。\nrickroll_msg = "<Replace me with str value>" # 文字过滤检测失败时的 Rickroll 消息。\nenable_rickroll = true # 当文字过滤检测失败时，是否 Rickroll 用户。\nenable_joke = true # 是否启用玩笑，启用后将在服务器时间 4 月 1 日时发生。\nshuffle_rate = 0 # 玩笑的随机发生率，范围 0 到 1 之间。\nunloaded_modules = [] # 不加载的模块列表，匹配到此列表中的模块将不会被加载。\ndebug = true # 是否启用调试模式，启用后会输出更多的日志信息。\nreport_targets = [] # 上报会话列表，此处填写的值将会被识别为上报会话。（如：在机器人执行命令出错时，机器人将会把错误信息发送至对应会话）\ntos_warning_counts = 5 # 违反 ToS 时的警告次数。\nbase_superuser = ["QQ|2596322644"] # 机器人的基础超级用户列表，此处填写的值将会在机器人启动时被加载进入数据库。\nenable_analytics = false # 是否启用内置的统计功能。\nbug_report_url = "https://s.wd-ljt.com/botreportbug" # 汇报错误网址。\ntos_temp_ban_time = 300 # 违反 ToS 时的临时封禁时间。\ntimezone_offset = "+8" # 机器人的默认时区偏移量。\nno_confirm = false # 是否无需发送者确认消息后再执行命令。\nconfirm_command = ["是", "对", "對", "yes", "Yes", "YES", "y", "Y"] # 确认命令的关键词，此处填写的值将会被识别为确认命令。\ncommand_prefix = ["~", "～"] # 命令前缀，此处填写的值将会被识别为命令前缀。\nallow_request_private_ip = false # 是否允许机器人请求本地私有 IP 地址。（防止可能的信息泄露）\nuse_font_mirror = false # 渲染网页时是否使用字体镜像。\nenable_get_petal = false # 是否允许获取花瓣。\npetal_gained_limit = 0 # 单日获取花瓣上限。\npetal_lost_limit = 0 # 单日失去花瓣上限。\npetal_sign_limit = 5 # 单日签到获取花瓣上限。\npetal_sign_rate = 0.5 # 签到获取花瓣概率，范围 0 到 1 之间，获取数量呈指数衰减。\nuse_secrets_random = false # 是否使用基于 secrets 库的随机数生成器。\nhelp_url = "https://bot.teahouse.team" # 帮助文档网址。\ndonate_url = "http://afdian.com/a/teahouse" # 捐赠网址。\nhelp_page_url = "https://bot.teahouse.team/wiki/${module}" # 模块帮助文档网址。\nallow_reload_base = false # 是否允许重载基础模块。\nenable_eval = true # 是否启用 eval 模块。\nenable_commit_url = true # 是否在展示版本信息时显示 commit URL。\nlocale_url = "https://www.crowdin.com/project/akari-bot" # 本地化项目网址。\nslower_schedule = false # 是否启用更慢的计划任务调度器。（减少请求压力用）\n\n\n[secret]\n# 密钥配置部分，此处的值若意外出现在发送的消息中，机器人会尝试拦截。但请务必提防泄露。\nproxy = "<Replace me with str value>" # 代理服务地址。\ncheck_access_key_id = "<Replace me with str value>" # 阿里云内容安全服务的 AccessKey ID。\ncheck_access_key_secret = "<Replace me with str value>" # 阿里云内容安全服务的 AccessKey Secret。\ndb_path = "sqlite://database/save.db" # 数据库连接字符串，请使用 Tortoise ORM 支持的数据库连接字符串格式。\n', // skipcq
  })
  mock.onPut('/api/config/config.toml').reply(403, {
    detail: 'Cannot edit data in demo mode',
  })

  mock.onGet('/api/config/bot_web.toml').reply(200, {
    content:
      '# https://toml.io/cn/v1.0.0\n# 注意：TOML 不是 Python。请不要在此处使用 Python 语法。\n# 例如：TOML 中的布尔值必须是小写。\n\n[bot_web]\n# 平台端的配置部分，此处填写的值可在消息中以明文形式展示。请不要在此部分填写敏感信息。\nenable_https = false # 是否启用 HTTPS 协议安全措施。\nweb_host = "127.0.0.1" # Web 服务的主机地址，设为 0.0.0.0 则监听所有地址。\nweb_port = 6485 # Web 服务的端口号，设为 0 则禁用服务。\nlogin_max_attempts = 5 # 登录请求最大次数限制。\nenable = true # 是否启用此平台。\nheartbeat_interval = 30 # 心跳信息发送时间间隔。\nheartbeat_timeout = 5 # 心跳消息回应超时时间。\nheartbeat_attempt = 3 # 心跳消息发送尝试次数。\n\n[bot_web_secret]\n# 平台端的密钥配置部分，此处的值若意外出现在发送的消息中，机器人会尝试拦截。但请务必提防泄露。\nallow_origins = [] # API 服务允许 CORS 的源列表。\njwt_secret = "<Replace me with str value>" # 内置 API 的身份认证密钥，用于签名和验证有效性。\n',
  })
  mock.onPut('/api/config/bot_web.toml').reply(403, {
    detail: 'Cannot edit data in demo mode',
  })

  // 演示用：仅有注释与表头的模块配置，用于展示「删除配置文件」入口
  mock.onGet('/api/config/module_wiki.toml').reply(200, {
    content:
      '# https://toml.io/cn/v1.0.0\n# 注意：TOML 不是 Python。请不要在此处使用 Python 语法。\n\n[wiki]\n# wiki_banned_url_prefix = [] # 不进行解析的网址前缀。\n# wiki_supported_langs = [] # 启用的语言列表。\n',
  })

  mock.onGet('/api/config/module_petal.toml').reply(200, {
    content:
      '# https://toml.io/cn/v1.0.0\n# 注意：TOML 不是 Python。请不要在此处使用 Python 语法。\n\n[petal]\n# enable_get_petal = false # 是否允许获取花瓣。\n# petal_sign_limit = 5 # 单日签到获取花瓣上限。\n',
  })

  // 后端仅允许读取配置目录下实际存在的 TOML 文件，其余返回 404。
  mock.onGet(/^\/api\/config\/[^/]+\.toml$/).reply(404, { detail: 'Not found' })

  // 演示模式不允许修改/删除任何配置文件。
  mock.onPut(/^\/api\/config\/[^/]+$/).reply(403, demoWriteDenied)
  mock.onDelete(/^\/api\/config\/[^/]+$/).reply(403, demoWriteDenied)

  const mockTargets = [
    {
      target_data: {},
      blocked: false,
      union_id: 'UTID|00000000000000000000000000000001',
      bound_ids: ['Web|Console|0'],
      muted: false,
      custom_admins: [],
      modules: ['wiki'],
      banned_users: [],
      locale: 'zh_cn',
    },
    {
      target_data: { welcome_message: 'Hello from AkariBot!' },
      blocked: false,
      union_id: 'UTID|00000000000000000000000000000002',
      bound_ids: ['Discord|123456789', 'QQ|10001'],
      muted: true,
      custom_admins: ['USID|00000000000000000000000000000002'],
      modules: ['wiki', 'petal'],
      banned_users: ['USID|00000000000000000000000000000003'],
      locale: 'en_us',
    },
    {
      target_data: {},
      blocked: true,
      union_id: 'UTID|00000000000000000000000000000003',
      bound_ids: ['Telegram|-1001234567890'],
      muted: false,
      custom_admins: [],
      modules: ['wiki'],
      banned_users: [],
      locale: 'ja_jp',
    },
    {
      target_data: {},
      blocked: false,
      union_id: 'UTID|00000000000000000000000000000004',
      bound_ids: ['QQ|20002'],
      muted: false,
      custom_admins: [],
      modules: [],
      banned_users: [],
      locale: 'zh_cn',
    },
  ].map((item) => ({ ...item, target_id: item.bound_ids[0] }))

  const mockSenders = [
    {
      sender_id: 'Web|0',
      union_id: 'USID|00000000000000000000000000000001',
      bound_ids: ['Web|0'],
      sender_data: {},
      blocked: false,
      superuser: true,
      petal: 0,
      warns: 0,
      trusted: false,
    },
    {
      sender_id: 'QQ|10001',
      union_id: 'USID|00000000000000000000000000000002',
      bound_ids: ['QQ|10001', 'Discord|987654'],
      sender_data: { nickname: 'Akari Fan' },
      blocked: false,
      superuser: false,
      petal: 10,
      warns: 2,
      trusted: true,
    },
    {
      sender_id: 'Telegram|12345678',
      union_id: 'USID|00000000000000000000000000000003',
      bound_ids: ['Telegram|12345678'],
      sender_data: {},
      blocked: true,
      superuser: false,
      petal: 0,
      warns: 1,
      trusted: false,
    },
  ]

  const filterByBoundIds = (items, matcher) =>
    items.filter((item) => (item.bound_ids || []).some((id) => matcher(id)))

  /** 与后端 pick_display_id 一致：优先返回匹配前缀的绑定 ID，否则取第一个绑定 ID。 */
  const pickDisplayId = (item, prefix) => {
    const ids = item.bound_ids || []
    if (prefix) {
      const matched = ids.find((value) => value.startsWith(`${prefix}|`))
      if (matched) return matched
    }
    return ids[0] || item.union_id
  }

  const collectPrefixes = (items) =>
    [
      ...new Set(
        items
          .flatMap((item) => item.bound_ids || [])
          .filter((value) => value.includes('|'))
          .map((value) => value.split('|', 1)[0]),
      ),
    ].sort((a, b) => a.localeCompare(b))

  mock.onGet('/api/platform_prefixes').reply(200, {
    target_prefixes: collectPrefixes(mockTargets),
    sender_prefixes: collectPrefixes(mockSenders),
  })

  mock.onGet('/api/target').reply((config) => {
    const params = config.params || {}
    const { prefix, status, id } = params

    let filtered = [...mockTargets]

    if (prefix) {
      filtered = filterByBoundIds(filtered, (targetId) => targetId.startsWith(`${prefix}|`))
    }

    if (status === 'muted') {
      filtered = filtered.filter((item) => item.muted === true)
    } else if (status === 'blocked') {
      filtered = filtered.filter((item) => item.blocked === true)
    }

    if (id) {
      filtered = filterByBoundIds(filtered, (targetId) =>
        targetId.toLowerCase().includes(id.toLowerCase()),
      )
    }

    const page = paginate(filtered, params)
    return [
      200,
      {
        target_list: page.items.map((item) => ({
          ...item,
          target_id: pickDisplayId(item, prefix),
        })),
        total: page.total,
      },
    ]
  })

  // 群组接口需要先于单条详情路由注册，避免被 /api/target/{target_id} 抢先匹配。
  mock.onGet(/^\/api\/target\/group\/[^/]+$/).reply((config) => {
    const unionId = decodeURIComponent(stripQuery(config.url).split('/api/target/group/')[1])
    const target = mockTargets.find((item) => item.union_id === unionId)
    if (!target) {
      return [404, { detail: 'Not found' }]
    }
    return [
      200,
      {
        target_group: {
          union_id: target.union_id,
          member_count: target.bound_ids.length,
          members: target.bound_ids.map((target_id, index) => ({
            target_id,
            channel_id: index + 1,
          })),
          blocked: target.blocked,
          muted: target.muted,
          locale: target.locale,
          modules: target.modules,
          custom_admins: target.custom_admins,
          banned_users: target.banned_users,
          target_data: target.target_data,
        },
      },
    ]
  })

  mock.onGet(/^\/api\/target\/[^/]+$/).reply((config) => {
    const targetId = decodeURIComponent(stripQuery(config.url).split('/api/target/')[1])
    const target = mockTargets.find(
      (item) => item.target_id === targetId || item.bound_ids.includes(targetId),
    )
    if (!target) {
      return [404, { detail: 'Not found' }]
    }
    return [
      200,
      {
        target_info: {
          ...target,
          target_id: targetId,
        },
      },
    ]
  })

  // 演示模式不允许修改或删除会话数据。
  mock.onPatch(/^\/api\/target\/[^/]+$/).reply(403, demoWriteDenied)
  mock.onDelete(/^\/api\/target\/[^/]+$/).reply(403, demoWriteDenied)

  mock.onGet('/api/sender').reply((config) => {
    const params = config.params || {}
    const { prefix, status, id } = params

    let filtered = [...mockSenders]

    if (prefix) {
      filtered = filterByBoundIds(filtered, (senderId) => senderId.startsWith(`${prefix}|`))
    }

    if (status === 'superuser') {
      filtered = filtered.filter((item) => item.superuser === true)
    } else if (status === 'trusted') {
      filtered = filtered.filter((item) => item.trusted === true)
    } else if (status === 'blocked') {
      filtered = filtered.filter((item) => item.blocked === true)
    }

    if (id) {
      filtered = filterByBoundIds(filtered, (senderId) =>
        senderId.toLowerCase().includes(id.toLowerCase()),
      )
    }

    const page = paginate(filtered, params)
    return [
      200,
      {
        sender_list: page.items.map((item) => ({
          ...item,
          sender_id: pickDisplayId(item, prefix),
        })),
        total: page.total,
      },
    ]
  })

  // 群组接口需要先于单条详情路由注册，避免被 /api/sender/{sender_id} 抢先匹配。
  mock.onGet(/^\/api\/sender\/group\/[^/]+$/).reply((config) => {
    const unionId = decodeURIComponent(stripQuery(config.url).split('/api/sender/group/')[1])
    const sender = mockSenders.find((item) => item.union_id === unionId)
    if (!sender) {
      return [404, { detail: 'Not found' }]
    }
    return [
      200,
      {
        sender_group: {
          union_id: sender.union_id,
          member_count: sender.bound_ids.length,
          members: sender.bound_ids,
          blocked: sender.blocked,
          trusted: sender.trusted,
          superuser: sender.superuser,
          warns: sender.warns,
          petal: sender.petal,
          sender_data: sender.sender_data,
        },
      },
    ]
  })

  mock.onGet(/^\/api\/sender\/[^/]+$/).reply((config) => {
    const senderId = decodeURIComponent(stripQuery(config.url).split('/api/sender/')[1])
    const sender = mockSenders.find(
      (item) => item.sender_id === senderId || item.bound_ids.includes(senderId),
    )
    if (!sender) {
      return [404, { detail: 'Not found' }]
    }
    return [
      200,
      {
        sender_info: {
          ...sender,
          sender_id: senderId,
        },
      },
    ]
  })

  // 演示模式不允许修改或删除用户数据。
  mock.onPatch(/^\/api\/sender\/[^/]+$/).reply(403, demoWriteDenied)
  mock.onDelete(/^\/api\/sender\/[^/]+$/).reply(403, demoWriteDenied)
  const mockModule = (overrides) => ({
    alias: [],
    recommend_modules: [],
    developers: ['Teahouse Studios'],
    available_for: [],
    exclude_from: [],
    support_languages: [],
    desc: '',
    required_admin: false,
    base: false,
    doc: false,
    hidden: false,
    load: true,
    rss: false,
    regex: false,
    event: false,
    required_superuser: false,
    required_base_superuser: false,
    required_bot_permissions: [],
    suppress_invalid_prompt: false,
    commands: 0,
    regexp: 0,
    events: 0,
    _db_load: true,
    ...overrides,
  })

  // 与后端 get_modules_info 的返回结构保持一致（对象以模块名为键）。
  const mockModules = {
    core: mockModule({
      module_name: 'core',
      base: true,
      desc: 'AkariBot 的核心基础模块，提供会话与消息处理能力。',
      commands: 12,
      events: 3,
      _py_module_name: 'core',
    }),
    help: mockModule({
      module_name: 'help',
      base: true,
      desc: '帮助信息模块，用于查看命令帮助。',
      commands: 4,
      _py_module_name: 'help',
    }),
    wiki: mockModule({
      module_name: 'wiki',
      desc: '维基百科查询模块，支持多语言条目检索。',
      commands: 3,
      _py_module_name: 'wiki',
    }),
    petal: mockModule({
      module_name: 'petal',
      desc: '花瓣模块，提供签到与花瓣系统。',
      commands: 6,
      _py_module_name: 'petal',
    }),
    meme: mockModule({
      module_name: 'meme',
      desc: '表情包模块，可选择并发送随机表情包。',
      commands: 2,
      _db_load: false,
      _py_module_name: 'meme',
    }),
    ai: mockModule({
      module_name: 'ai',
      desc: 'AI 对话模块，接入大语言模型进行对话。',
      commands: 3,
      _py_module_name: 'ai',
    }),
  }

  const mockRelatedModules = {
    core: [],
    help: [],
    wiki: ['ai'],
    petal: ['wiki'],
    meme: [],
    ai: ['wiki'],
  }

  mock.onGet('/api/modules').reply(200, {
    modules: Object.fromEntries(
      Object.entries(mockModules).filter(([, info]) => info.load === true),
    ),
  })

  mock.onGet('/api/modules_list').reply(200, {
    // 后端返回可加载的非基础模块名称列表（含当前未加载的模块）。
    modules: Object.values(mockModules)
      .filter((info) => info.load === true && info.base !== true)
      .map((info) => info.module_name),
  })
  const mockModuleHelpDocs = {
    core: {
      module_name: 'core',
      desc: 'AkariBot 的核心基础模块。',
      commands: {
        args: [{ args: '~help', desc: '查看命令帮助。' }],
        options: [{ '--locale': '指定显示语言，例如 zh_cn、en_us。' }],
      },
      regexp: [],
    },
    help: {
      module_name: 'help',
      desc: '帮助信息模块。',
      commands: {
        args: [{ args: '~help <module>', desc: '查看指定模块的帮助信息。' }],
        options: [],
      },
      regexp: [],
    },
    wiki: {
      module_name: 'wiki',
      desc: '维基百科查询模块。',
      commands: {
        args: [
          { args: '~wiki <keyword>', desc: '查询指定关键词的维基百科条目。' },
          { args: '~wiki --lang <code> <keyword>', desc: '指定语言查询维基百科。' },
        ],
        options: [{ '--lang': '维基百科语言代码，例如 zh、en。' }],
      },
      regexp: [],
    },
    petal: {
      module_name: 'petal',
      desc: '花瓣模块。',
      commands: {
        args: [
          { args: '~petal', desc: '查看当前花瓣数量。' },
          { args: '~petal sign', desc: '进行一次每日签到。' },
        ],
        options: [],
      },
      regexp: [],
    },
    meme: {
      module_name: 'meme',
      desc: '表情包模块。',
      commands: {
        args: [{ args: '~meme', desc: '随机发送一张表情包。' }],
        options: [],
      },
      regexp: [],
    },
    ai: {
      module_name: 'ai',
      desc: 'AI 对话模块。',
      commands: {
        args: [{ args: '~ai <prompt>', desc: '向 AI 发送对话请求。' }],
        options: [{ '--model': '指定使用的模型。' }],
      },
      regexp: [],
    },
  }

  mock.onGet(/^\/api\/module\/[^/]+\/related$/).reply((config) => {
    const name = decodeURIComponent(stripQuery(config.url).split('/api/module/')[1].split('/')[0])
    return [200, { modules: mockRelatedModules[name] || [] }]
  })

  mock.onGet(/^\/api\/module\/[^/]+\/helpdoc$/).reply((config) => {
    const name = decodeURIComponent(stripQuery(config.url).split('/api/module/')[1].split('/')[0])
    const helpDoc = mockModuleHelpDocs[name]
    if (!helpDoc) {
      return [404, { detail: 'Not found' }]
    }
    return [200, helpDoc]
  })

  // 演示模式允许切换内存中的模块状态（刷新页面后恢复）。
  mock.onPost(/^\/api\/module\/[^/]+\/(reload|load|unload)$/).reply((config) => {
    const matched = stripQuery(config.url).match(/^\/api\/module\/([^/]+)\/(reload|load|unload)$/)
    const name = decodeURIComponent(matched[1])
    const action = matched[2]
    const moduleInfo =
      mockModules[name] || Object.values(mockModules).find((item) => item._py_module_name === name)

    if (!moduleInfo) {
      const actionName = action === 'reload' ? 'Reload' : action === 'load' ? 'Load' : 'Unload'
      return [422, { detail: `${actionName} modules failed` }]
    }
    if (action === 'unload') {
      if (moduleInfo.base) {
        return [422, { detail: 'Unload modules failed' }]
      }
      moduleInfo._db_load = false
    } else if (action === 'load') {
      moduleInfo._db_load = true
    }
    return [204]
  })

  // 重启与更新接口在后端以 SSE 返回进度，这里提供同形态的演示数据。
  mock.onPost('/api/restart').reply((config) => {
    const body = readJsonBody(config) || {}
    const force = body.force === true
    const payload = [
      sse('status', {
        pending: true,
        force,
        state: force ? 'restarting' : 'waiting',
        active_sessions: 0,
      }),
      sse('status', { pending: false, force: false, state: 'idle', active_sessions: 0 }),
    ].join('')
    return [202, payload, { 'Content-Type': 'text/event-stream' }]
  })

  mock.onPost('/api/update').reply((config) => {
    const body = readJsonBody(config) || {}
    const force = body.force === true
    const events = [
      ['start', { force }],
      ['stage', { stage: 'git', action: force ? 'reset' : 'pull' }],
      ['output', { stage: 'git', line: 'Already up to date.' }],
      ['stage', { stage: 'git', action: force ? 'reset' : 'pull', returncode: 0 }],
      ['stage', { stage: 'dependencies', tool: 'uv' }],
      ['output', { stage: 'dependencies', line: 'Resolved 128 packages in 0.42s' }],
      ['stage', { stage: 'dependencies', tool: 'uv', returncode: 0 }],
      ['done', { success: true }],
    ]
    return [
      202,
      events.map(([event, data]) => sse(event, data)).join(''),
      { 'Content-Type': 'text/event-stream' },
    ]
  })

  // WebRender：config 来自 WebUI 进程，status 来自服务端
  const mockWebRenderConfig = {
    enable: true,
    browser_type: 'chrome',
    browser_executable_path: '',
    headless: true,
    remote_only: false,
    remote_url: '',
  }

  // 演示用：故意让 contexts 与 contexts_total 不一致，以便展示 leaked 告警
  const mockWebRenderStatus = {
    available: true,
    browser_initialized: true,
    browser_mode: 'headless',
    headless: true,
    keep_pages_open: false,
    debug_mode: false,
    remote_only: false,
    remote_configured: false,
    remote_timeout: 30,
    export_logs: true,
    logs_path: './logs',
    name: 'AkariBot WebRender™',
    contexts: [{ index: 0, pages: ['https://example.test/', 'https://bot.teahouse.team/'] }],
    contexts_total: 2,
    leaked: true,
  }

  const mockScreenshot =
    'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAXklEQVR42u3QMQEAAAgDoJnc6BpjDyQgd1MFAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAgQIECBAgAABAj4NLQAB0m8W6QAAAABJRU5ErkJggg=='

  mock.onGet('/api/webrender').reply(200, {
    config: mockWebRenderConfig,
    status: mockWebRenderStatus,
  })

  mock.onPost('/api/webrender/control').reply((config) => {
    let body = {}
    try {
      body = JSON.parse(config.data || '{}')
    } catch {
      return [400, { detail: 'invalid_json' }]
    }

    const action = body.action
    if (!['start', 'stop', 'restart'].includes(action)) {
      return [422, { detail: 'invalid_action' }]
    }

    if (action === 'stop') {
      mockWebRenderStatus.available = false
      mockWebRenderStatus.browser_initialized = false
      mockWebRenderStatus.contexts = []
      mockWebRenderStatus.contexts_total = 0
      mockWebRenderStatus.leaked = false
    } else {
      mockWebRenderStatus.available = true
      mockWebRenderStatus.browser_initialized = true
    }

    return [
      200,
      {
        ok: true,
        error: null,
        status: { ...mockWebRenderStatus },
      },
    ]
  })

  // 演示模式下文件接口只读，提供一棵可浏览的虚拟目录树。
  const mockFileModified = '2025-08-15T10:23:45'
  const mockTextFile = (content) => ({ content })
  const mockImageFile = (base64, mime = 'image/png') => ({ base64, mime })

  const mockStorageTree = {
    'core:data': {
      children: {
        'README.md': mockTextFile('# AkariBot 数据目录\n\n演示模式下可浏览文件，但无法修改。\n'),
        config: {
          children: {
            'example.toml': mockTextFile('[demo]\nenabled = true # 演示配置示例\n'),
          },
        },
        private: {
          children: {
            web: { children: { '.devices': mockTextFile('{\n  "devices": {}\n}\n') } },
          },
        },
      },
    },
    'core:assets': {
      children: {
        'akari-logo.png': mockImageFile(mockScreenshot),
        'notice.txt': mockTextFile('AkariBot demo assets\n'),
      },
    },
    'core:cache': {
      children: {
        'README.md': mockTextFile('# 缓存目录\n\n缓存会在运行时自动生成。\n'),
      },
    },
    'module:wiki:data': {
      children: {
        'wiki_cache.json': mockTextFile('{\n  "zh_cn": {}\n}\n'),
      },
    },
    'module:wiki:assets': {
      children: {
        'help.md': mockTextFile('# Wiki 模块\n\n使用 `~wiki <keyword>` 查询条目。\n'),
        images: { children: { 'wiki-example.png': mockImageFile(mockScreenshot) } },
      },
    },
    'module:petal:data': {
      children: {
        'petals.json': mockTextFile('{\n  "daily_limit": 5\n}\n'),
      },
    },
  }

  const mockStorageRoots = {
    'core:data': { scope: 'core', module: null, target: 'data', path: './data' },
    'core:assets': { scope: 'core', module: null, target: 'assets', path: './assets' },
    'core:cache': { scope: 'core', module: null, target: 'cache', path: './cache' },
    'module:wiki:data': {
      scope: 'module',
      module: 'wiki',
      target: 'data',
      path: './modules/wiki/data',
    },
    'module:wiki:assets': {
      scope: 'module',
      module: 'wiki',
      target: 'assets',
      path: './modules/wiki/assets',
    },
    'module:petal:data': {
      scope: 'module',
      module: 'petal',
      target: 'data',
      path: './modules/petal/data',
    },
  }

  const normalizeStoragePath = (path = '') =>
    String(path)
      .replace(/\\/g, '/')
      .replace(/^\/+|\/+$/g, '')

  const getStorageNode = (rootId, path = '') => {
    const root = mockStorageTree[rootId]
    if (!root) return null
    let node = root
    for (const segment of normalizeStoragePath(path).split('/').filter(Boolean)) {
      if (!node.children || !node.children[segment]) return null
      node = node.children[segment]
    }
    return node
  }

  const isStorageDirectory = (node) => Boolean(node && node.children)
  const storageFileSize = (node) => {
    if (!node) return 0
    if (typeof node.content === 'string') return new TextEncoder().encode(node.content).length
    if (typeof node.base64 === 'string') return Math.floor((node.base64.length * 3) / 4)
    return 0
  }

  /** 生成与后端等长的 16 位修订号（仅用于演示的乐观锁比对）。 */
  const storageRevision = (rootId, path) => {
    let hash = 2166136261
    const text = `${rootId}:${path}`
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i)
      hash = Math.imul(hash, 16777619)
    }
    return (hash >>> 0).toString(16).padStart(8, '0').repeat(2)
  }

  const storageFileInfo = (rootId, path, node) => ({
    name: path.split('/').pop() || rootId,
    path,
    is_dir: isStorageDirectory(node),
    size: isStorageDirectory(node) ? 0 : storageFileSize(node),
    modified: mockFileModified,
    revision: isStorageDirectory(node) ? null : storageRevision(rootId, path),
  })

  const base64ToBlob = (base64, type) => {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type })
  }

  mock.onGet('/api/files/roots').reply(200, {
    roots: Object.entries(mockStorageRoots).map(([id, root]) => ({ id, ...root, exists: true })),
  })

  mock.onGet('/api/files/list').reply((config) => {
    const rootId = config.params?.root
    const relative = normalizeStoragePath(config.params?.path || '')
    if (!mockStorageTree[rootId]) return [404, { detail: 'unknown_root' }]
    const node = getStorageNode(rootId, relative)
    if (!node) return [200, { root: rootId, path: relative, exists: false, files: [] }]
    if (!isStorageDirectory(node)) return [400, { detail: 'not_a_directory' }]

    const files = Object.keys(node.children)
      .map((name) =>
        storageFileInfo(rootId, relative ? `${relative}/${name}` : name, node.children[name]),
      )
      .sort((a, b) => (a.is_dir === b.is_dir ? a.name.localeCompare(b.name) : a.is_dir ? -1 : 1))
    return [200, { root: rootId, path: relative, exists: true, files }]
  })

  mock.onGet('/api/files/content').reply((config) => {
    const rootId = config.params?.root
    const relative = normalizeStoragePath(config.params?.path || '')
    if (!mockStorageTree[rootId]) return [404, { detail: 'unknown_root' }]
    const node = getStorageNode(rootId, relative)
    if (!node) return [404, { detail: 'not_found' }]
    if (isStorageDirectory(node)) return [400, { detail: 'is_directory' }]
    if (typeof node.content !== 'string') return [415, { detail: 'not_text' }]

    return [
      200,
      {
        root: rootId,
        path: relative,
        content: node.content,
        size: storageFileSize(node),
        modified: mockFileModified,
        revision: storageRevision(rootId, relative),
      },
    ]
  })

  mock.onGet('/api/files/download').reply((config) => {
    const rootId = config.params?.root
    const relative = normalizeStoragePath(config.params?.path || '')
    if (!mockStorageTree[rootId]) return [404, { detail: 'unknown_root' }]
    const node = getStorageNode(rootId, relative)
    if (!node) return [404, { detail: 'not_found' }]

    if (isStorageDirectory(node)) {
      // 后端会把目录打包成 zip；演示模式返回一个空 zip，保持前端下载流程可用。
      const emptyZip = base64ToBlob('UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==', 'application/zip')
      return [200, emptyZip, { 'Content-Type': 'application/zip' }]
    }
    if (typeof node.base64 === 'string') {
      const mime = node.mime || 'application/octet-stream'
      return [200, base64ToBlob(node.base64, mime), { 'Content-Type': mime }]
    }
    const mime = 'text/plain;charset=utf-8'
    return [200, new Blob([node.content ?? ''], { type: mime }), { 'Content-Type': mime }]
  })

  // 与后端一致：上传/创建/重命名/删除/写入均需写权限，演示模式下一律拒绝。
  mock.onPut('/api/files/content').reply(403, demoWriteDenied)
  mock.onPost('/api/files/upload').reply(403, demoWriteDenied)
  mock.onPost('/api/files/create').reply(403, demoWriteDenied)
  mock.onPost('/api/files/rename').reply(403, demoWriteDenied)
  mock.onDelete('/api/files/entry').reply(403, demoWriteDenied)

  mock.onPost('/api/webrender/test').reply((config) => {
    const body = readJsonBody(config)
    if (!body) {
      return [400, { detail: 'invalid_json' }]
    }

    const mode = body.mode || 'status'
    const outputType = body.output_type || 'jpeg'

    if (!['status', 'source', 'screenshot'].includes(mode)) {
      return [422, { detail: 'invalid_mode' }]
    }

    if (!mockWebRenderConfig.enable) {
      return [422, { detail: 'web_render_disabled' }]
    }

    if (mode === 'status') {
      return [
        200,
        {
          ok: mockWebRenderStatus.available,
          mode,
          elapsed: 0.01,
          status: { ...mockWebRenderStatus },
          source: null,
          source_truncated: false,
          images: [],
          output_type: null,
          error: mockWebRenderStatus.available ? null : 'browser_unavailable',
        },
      ]
    }

    if (!mockWebRenderStatus.available) {
      return [
        200,
        {
          ok: false,
          mode,
          elapsed: 0.05,
          status: null,
          source: null,
          source_truncated: false,
          images: [],
          output_type: null,
          error: 'browser_unavailable',
        },
      ]
    }

    if (mode === 'source') {
      if (!body.url) {
        return [422, { detail: 'missing_target' }]
      }
      const source = `<!DOCTYPE html>\n<html lang="${body.locale || 'zh_cn'}">\n  <head>\n    <title>${body.url}</title>\n  </head>\n  <body>\n    <pre>Mock source of ${body.url}</pre>\n  </body>\n</html>`
      return [
        200,
        {
          ok: true,
          mode,
          elapsed: 1.23,
          status: { ...mockWebRenderStatus },
          source: body.raw_text ? `Mock source of ${body.url}` : source,
          source_truncated: false,
          images: [],
          output_type: null,
          error: null,
        },
      ]
    }

    if (!body.url && !body.content) {
      return [422, { detail: 'missing_target' }]
    }

    return [
      200,
      {
        ok: true,
        mode,
        elapsed: 1.82,
        status: { ...mockWebRenderStatus },
        source: null,
        source_truncated: false,
        images: [mockScreenshot],
        output_type: outputType,
        error: null,
      },
    ]
  })

  // 未被覆盖的接口统一返回 404，避免演示模式向真实后端发起请求。
  mock
    .onAny()
    .reply((config) => [
      404,
      { detail: `Not found: ${config.method?.toUpperCase()} ${stripQuery(config.url)}` },
    ])
}
