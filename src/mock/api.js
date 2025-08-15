import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

export default function setupMock() {
  const mock = new MockAdapter(axios)

  mock.onGet('/api').reply(200, { message: 'Hello, AkariBot!' })

  mock.onGet('/api/verify-token').reply(200, {
    message: 'Success',
    payload: {
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      iat: Math.floor(Date.now() / 1000),
      iss: 'auth-api',
    },
  })

  mock.onGet('/api/get-csrf-token').reply(200, {
    message: 'Success',
    csrf_token: 'f9bf78b9a18ce6d46a0cd2b0b86df9da',
  })

  mock.onGet('/api/check-password').reply(200, { message: 'Success' })

  mock.onPost('/api/auth').reply(200, { message: 'Success' })

  mock.onPost('/api/change-password').reply(403, {
    detail: 'Cannot edit data in demo mode',
  })
  mock.onGet('/api/server-info').reply(200, {
    message: 'Success',
    os: {
      system: 'Linux',
      version: '#42~22.04.3-Ubuntu SMP Fri Aug 15 10:23:45 UTC 2025',
      machine: 'x86_64',
      boot_time: Math.floor(Date.now() / 1000) - 42314,
    },
    bot: {
      running_time: 42314,
      python_version: '3.12.8',
      version: 'badf0d',
      web_render_status: false,
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
  })

  mock.onGet('/api/analytics').reply(() => {
    const now = new Date()

    const isoWithMs = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()

    const isoWithMicros = isoWithMs.replace('Z', '000+00:00')

    return [
      200,
      {
        message: 'Success',
        count: 2,
        change_rate: 2,
        data: [
          {
            id: 1,
            module_name: 'ping',
            module_type: 'normal',
            target_id: 'Web|Console|0',
            sender_id: 'Web|0',
            command: 'analytics',
            timestamp: isoWithMicros,
          },
          {
            id: 2,
            module_name: 'help',
            module_type: 'normal',
            target_id: 'Web|Console|0',
            sender_id: 'Web|0',
            command: 'ping',
            timestamp: isoWithMicros,
          },
        ],
      },
    ]
  })

  mock.onGet('/api/config').reply(200, {
    message: 'Success',
    cfg_files: ['config.toml', 'bot_web.toml'],
  })

  mock.onGet('/api/config/config.toml').reply(200, {
    message: 'Success',
    content:
      '# https://toml.io/cn/v1.0.0\n# 注意：TOML 不是 Python。请不要在此处使用 Python 语法。\n# 例如：TOML 中的布尔值必须是小写。\n\ndefault_locale = "zh_cn" # 默认的会话语言环境。\nconfig_version = 2 # 配置版本号，将会随功能更新自增，一般情况请勿修改。\ninitialized = true\n\n[config]\n# 一些基础的配置部分，此处填写的值可在消息中以明文形式展示。请不要在此部分填写敏感信息。\nenable_dirty_check = false # 是否启用文字过滤检测，需要配置阿里云内容安全服务的 AccessKey ID 与 AccessKey Secret。\nenable_urlmanager = true # 是否启用 URLManager，用于 URL 跳板用。（声明此 URL 非官方链接等）\nenable_tos = true # 是否启用内置的 ToS 检查规则。\nignored_sender = ["QQ|2854196310"] # 无视的用户列表，匹配到此列表中的用户将会被忽略。\nissue_url = "https://github.com/Teahouse-Studios/bot/issues/new/choose" # 问题反馈网址。\nenable_petal = false # 是否启用花瓣功能。\nrickroll_msg = "<Replace me with str value>" # 文字过滤检测失败时的 Rickroll 消息。\nenable_rickroll = true # 当文字过滤检测失败时，是否 Rickroll 用户。\nenable_joke = true # 是否启用玩笑，启用后将在服务器时间 4 月 1 日时发生。\nshuffle_rate = 0 # 玩笑的随机发生率，范围 0 到 1 之间。\nunloaded_modules = [] # 不加载的模块列表，匹配到此列表中的模块将不会被加载。\ndebug = true # 是否启用调试模式，启用后会输出更多的日志信息。\nreport_targets = [] # 上报会话列表，此处填写的值将会被识别为上报会话。（如：在机器人执行命令出错时，机器人将会把错误信息发送至对应会话）\ntos_warning_counts = 5 # 违反 ToS 时的警告次数。\nbase_superuser = ["QQ|2596322644"] # 机器人的基础超级用户列表，此处填写的值将会在机器人启动时被加载进入数据库。\nenable_analytics = false # 是否启用内置的统计功能。\nbug_report_url = "https://s.wd-ljt.com/botreportbug" # 汇报错误网址。\ntos_temp_ban_time = 300 # 违反 ToS 时的临时封禁时间。\ntimezone_offset = "+8" # 机器人的默认时区偏移量。\nno_confirm = false # 是否无需发送者确认消息后再执行命令。\nconfirm_command = ["是", "对", "對", "yes", "Yes", "YES", "y", "Y"] # 确认命令的关键词，此处填写的值将会被识别为确认命令。\ncommand_prefix = ["~", "～"] # 命令前缀，此处填写的值将会被识别为命令前缀。\nallow_request_private_ip = false # 是否允许机器人请求本地私有 IP 地址。（防止可能的信息泄露）\nuse_font_mirror = false # 渲染网页时是否使用字体镜像。\nenable_get_petal = false # 是否允许获取花瓣。\npetal_gained_limit = 0 # 单日获取花瓣上限。\npetal_lost_limit = 0 # 单日失去花瓣上限。\npetal_sign_limit = 5 # 单日签到获取花瓣上限。\npetal_sign_rate = 0.5 # 签到获取花瓣概率，范围 0 到 1 之间，获取数量呈指数衰减。\nuse_secrets_random = false # 是否使用基于 secrets 库的随机数生成器。\nhelp_url = "https://bot.teahouse.team" # 帮助文档网址。\ndonate_url = "http://afdian.com/a/teahouse" # 捐赠网址。\nhelp_page_url = "https://bot.teahouse.team/wiki/${module}" # 模块帮助文档网址。\nallow_reload_base = false # 是否允许重载基础模块。\nenable_eval = true # 是否启用 eval 模块。\nenable_commit_url = true # 是否在展示版本信息时显示 commit URL。\nlocale_url = "https://www.crowdin.com/project/akari-bot" # 本地化项目网址。\nslower_schedule = false # 是否启用更慢的计划任务调度器。（减少请求压力用）\n\n\n[secret]\n# 密钥配置部分，此处的值若意外出现在发送的消息中，机器人会尝试拦截。但请务必提防泄露。\nproxy = "<Replace me with str value>" # 代理服务地址。\ncheck_access_key_id = "<Replace me with str value>" # 阿里云内容安全服务的 AccessKey ID。\ncheck_access_key_secret = "<Replace me with str value>" # 阿里云内容安全服务的 AccessKey Secret。\ndb_path = "sqlite://database/save.db" # 数据库连接字符串，请使用 Tortoise ORM 支持的数据库连接字符串格式。\n',
  })
  mock.onPost('/api/config/config.toml/edit').reply(403, {
    detail: 'Cannot edit data in demo mode',
  })

  mock.onGet('/api/config/bot_web.toml').reply(200, {
    message: 'Success',
    content:
      '# https://toml.io/cn/v1.0.0\n# 注意：TOML 不是 Python。请不要在此处使用 Python 语法。\n# 例如：TOML 中的布尔值必须是小写。\n\n[bot_web]\n# 平台端的配置部分，此处填写的值可在消息中以明文形式展示。请不要在此部分填写敏感信息。\nenable_https = false # 是否启用 HTTPS 协议安全措施。\nweb_host = "127.0.0.1" # Web 服务的主机地址，设为 0.0.0.0 则监听所有地址。\nweb_port = 6485 # Web 服务的端口号，设为 0 则禁用服务。\nlogin_max_attempts = 5 # 登录请求最大次数限制。\nenable = true # 是否启用此平台。\nheartbeat_interval = 30 # 心跳信息发送时间间隔。\nheartbeat_timeout = 5 # 心跳消息回应超时时间。\nheartbeat_attempt = 3 # 心跳消息发送尝试次数。\n\n[bot_web_secret]\n# 平台端的密钥配置部分，此处的值若意外出现在发送的消息中，机器人会尝试拦截。但请务必提防泄露。\nallow_origins = [] # API 服务允许 CORS 的源列表。\njwt_secret = "<Replace me with str value>" # 内置 API 的身份认证密钥，用于签名和验证有效性。\n',
  })
  mock.onPost('/api/config/bot_web.toml/edit').reply(403, {
    detail: 'Cannot edit data in demo mode',
  })

  const mockTargets = [
    {
      target_data: {},
      blocked: false,
      target_id: 'Web|Console|0',
      muted: false,
      custom_admins: [],
      modules: ['wiki'],
      banned_users: [],
      locale: 'zh_cn',
    },
  ]

  mock.onGet('/api/target').reply((config) => {
    let { prefix, status, id } = config.params || {}

    let filtered = mockTargets

    if (prefix) {
      filtered = filtered.filter((item) => item.target_id.startsWith(`${prefix}|`))
    }

    if (status === 'muted') {
      filtered = filtered.filter((item) => item.muted === true)
    } else if (status === 'blocked') {
      filtered = filtered.filter((item) => item.blocked === true)
    }

    if (id) {
      filtered = filtered.filter((item) => item.target_id.toLowerCase().includes(id.toLowerCase()))
    }

    return [
      200,
      {
        message: 'Success',
        target_list: filtered,
        total: filtered.length,
      },
    ]
  })

  mock.onPost('/api/target/Web|Console|0/edit').reply(403, {
    detail: 'Cannot edit data in demo mode',
  })
  mock.onPost('/api/target/Web|Console|0/delete').reply(403, {
    detail: 'Cannot edit data in demo mode',
  })

  const mockSenders = [
    {
      sender_id: 'Web|0',
      sender_data: {},
      blocked: false,
      superuser: true,
      petal: 0,
      warns: 0,
      trusted: false,
    },
  ]

  mock.onGet('/api/sender').reply((config) => {
    let { prefix, status, id } = config.params || {}

    let filtered = mockSenders

    if (prefix) {
      filtered = filtered.filter((item) => item.sender_id.startsWith(`${prefix}|`))
    }

    if (status === 'superuser') {
      filtered = filtered.filter((item) => item.superuser === true)
    } else if (status === 'trusted') {
      filtered = filtered.filter((item) => item.trusted === true)
    } else if (status === 'blocked') {
      filtered = filtered.filter((item) => item.blocked === true)
    }

    if (id) {
      filtered = filtered.filter((item) => item.sender_id.toLowerCase().includes(id.toLowerCase()))
    }

    return [
      200,
      {
        message: 'Success',
        sender_list: filtered,
        total: filtered.length,
      },
    ]
  })

  mock.onPost('/api/sender/Web|0/edit').reply(403, {
    detail: 'Cannot edit data in demo mode',
  })
  mock.onPost('/api/sender/Web|0/delete').reply(403, {
    detail: 'Cannot edit data in demo mode',
  })
  mock.onGet('/api/modules_list').reply(200, {
    message: 'Success',
    modules: [],
  })
  mock.onPost('/api/restart').reply(200, { message: 'Success' })
}
