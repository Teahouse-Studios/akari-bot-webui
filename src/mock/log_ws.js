export default function mockLogWebSocket(onMessage) {
  const logs = [
    '[SERVER][core.server.init:init_async:32][{time0}][INFO]:Initializing database...',
    '[SERVER][core.database:fetch_module_db:25][{time3}][DEBUG]:Database list: []',
    '[SERVER][core.server.init:init_async:34][{time3}][SUCCESS]:Database initialized successfully.',
    '[SERVER][core.loader:load_modules:35][{time3}][INFO]:Attempting to load modules...',
    '[SERVER][core.loader:load_modules:52][{time3}][SUCCESS]:All modules loaded.',
    '[SERVER][core.server.init:init_async:57][{time3}][INFO]:Hello, Server!',
    '[SERVER][core.server.background_tasks:init_background_task:39][{time3}][INFO]:Starting WebRender...',
    '[SERVER][core.web_render:init_web_render:22][{time3}][INFO]:WebRender is disabled in the configuration.',
    '[SERVER][core.ip:fetch_ip_info:15][{time3}][INFO]:Fetching IP information...',
    '[SERVER][core.utils.http:get_:79][{time3}][DEBUG]:[GET] https://api.ip.sb/geoip',
    '[SERVER][core.logger:exception:97][{time16}][ERROR]:Traceback (most recent call last):',
    '  File "/home/user/.cache/pypoetry/virtualenvs/akari-bot-Q4nmE730-py3.12/lib/site-packages/httpx/_transports/default.py", line 101, in map_httpcore_exceptions',
    '    yield',
    '  File "/home/user/.cache/pypoetry/virtualenvs/akari-bot-Q4nmE730-py3.12/lib/site-packages/httpx/_transports/default.py", line 394, in handle_async_request',
    '    resp = await self._pool.handle_async_request(req)',
    '           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
    '  File "/home/user/.cache/pypoetry/virtualenvs/akari-bot-Q4nmE730-py3.12/lib/site-packages/httpcore/_async/connection_pool.py", line 256, in handle_async_request',
    '    raise exc from None',
    '  File "/home/user/.cache/pypoetry/virtualenvs/akari-bot-Q4nmE730-py3.12/lib/site-packages/httpcore/_async/connection_pool.py", line 236, in handle_async_request',
    '    response = await connection.handle_async_request(',
    '               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
    '  File "/home/user/.cache/pypoetry/virtualenvs/akari-bot-Q4nmE730-py3.12/lib/site-packages/httpcore/_async/http_proxy.py", line 288, in handle_async_request',
    '    connect_response = await self._connection.handle_async_request(',
    '                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
    '  File "/home/user/.cache/pypoetry/virtualenvs/akari-bot-Q4nmE730-py3.12/lib/site-packages/httpcore/_async/connection.py", line 101, in handle_async_request',
    '    raise exc',
    '  File "/home/user/.cache/pypoetry/virtualenvs/akari-bot-Q4nmE730-py3.12/lib/site-packages/httpcore/_async/connection.py", line 78, in handle_async_request',
    '    stream = await self._connect(request)',
    '             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
    '  File "/home/user/.cache/pypoetry/virtualenvs/akari-bot-Q4nmE730-py3.12/lib/site-packages/httpcore/_async/connection.py", line 124, in _connect',
    '    stream = await self._network_backend.connect_tcp(**kwargs)',
    '             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
    '  File "/home/user/.cache/pypoetry/virtualenvs/akari-bot-Q4nmE730-py3.12/lib/site-packages/httpcore/_backends/auto.py", line 31, in connect_tcp',
    '    return await self._backend.connect_tcp(',
    '           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
    '  File "/home/user/.cache/pypoetry/virtualenvs/akari-bot-Q4nmE730-py3.12/lib/site-packages/httpcore/_backends/anyio.py", line 113, in connect_tcp',
    '    with map_exceptions(exc_map):',
    '  File "/usr/lib/python3.12/contextlib.py", line 158, in __exit__',
    '    self.gen.throw(value)',
    '  File "/home/user/.cache/pypoetry/virtualenvs/akari-bot-Q4nmE730-py3.12/lib/site-packages/httpcore/_exceptions.py", line 14, in map_exceptions',
    '    raise to_exc(exc) from exc',
    'httpcore.ConnectError: All connection attempts failed',
    '',
    'The above exception was the direct cause of the following exception:',
    '',
    'Traceback (most recent call last):',
    '  File "/home/user/akari-bot/core/utils/http.py", line 96, in get_',
    '    resp = await client.get(',
    '           ^^^^^^^^^^^^^^^^^',
    '  File "/home/user/.cache/pypoetry/virtualenvs/akari-bot-Q4nmE730-py3.12/lib/site-packages/httpx/_client.py", line 1768, in get',
    '    return await self.request(',
    '           ^^^^^^^^^^^^^^^^^^^',
    '  File "/home/user/.cache/pypoetry/virtualenvs/akari-bot-Q4nmE730-py3.12/lib/site-packages/httpx/_client.py", line 1540, in request',
    '    return await self.send(request, auth=auth, follow_redirects=follow_redirects)',
    '           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
    'httpx.ConnectError: All connection attempts failed',
    '',
    '[SERVER][core.ip:fetch_ip_info:21][{time16}][ERROR]:Failed to get IP information.',
    '[WEB][bots.web.bot:<module>:88][{time16}][WARNING]:HTTPS is disabled. HTTP mode is insecure and should only be used in trusted environments.',
    '[WEB][core.client.init:client_init:38][{time16}][INFO]:Hello, Web!',
    '[WEB][bots.web.client:lifespan:62][{time16}][INFO]:',
    '---',
    'Visit AkariBot WebUI:',
    'http://127.0.0.1:6485/webui',
    '---',
    '[SERVER][core.server.run:main:28][{time16}][INFO]:Stopping AkariBot Server...',
    '[SERVER][core.server.terminate:cleanup_sessions:13][{time16}][WARNING]:Cleaning up sessions...',
    '[SERVER][core.database.models:clear_task:425][{time16}][DEBUG]:Clearing tasks older than {time16_dt}...',
    '[SERVER][core.server.run:main:30][{time16}][SUCCESS]:AkariBot Server stopped successfully.',
  ]

  const base = new Date(Date.now() - 30000)

  const formatTime = (date) => {
    const pad = (n) => String(n).padStart(2, '0')
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    )
  }

  const times = {
    time0: formatTime(base),
    time3: formatTime(new Date(base.getTime() + 3000)),
    time9: formatTime(new Date(base.getTime() + 9000)),
    time14: formatTime(new Date(base.getTime() + 14000)),
    time16: formatTime(new Date(base.getTime() + 16000)),
    time16_dt: new Date(base.getTime() + 16000).toISOString(),
  }

  const finalLogs = logs.map((line) => line.replace(/\{(\w+)\}/g, (_, key) => times[key] || ''))

  finalLogs.forEach((line) => onMessage({ data: line }))

  return {
    close() {},
  }
}
