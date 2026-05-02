A simple HTML/JS/CSS starter template

## Supabase Auth 설정

이 사이트의 회원 가입/로그인은 Supabase Auth의 이메일/비밀번호 인증을 사용합니다.

1. Supabase 프로젝트를 만들고 Dashboard에서 `Project URL`과 `publishable` key를 확인합니다.
2. `index.html` 상단의 `window.IDKWELL_SUPABASE` 값을 실제 값으로 교체합니다.
3. Supabase Dashboard의 Authentication 설정에서 Email provider를 활성화합니다.
4. 배포 도메인을 Authentication URL Configuration의 Site URL과 Redirect URLs에 추가합니다.

Supabase CLI가 설치되어 있다면 공식 CLI 전역 플래그를 사용해 프로젝트 위치를 명시할 수 있습니다.

```bash
supabase init --workdir /home/user/idontnow --yes
supabase status --workdir /home/user/idontnow --output pretty
supabase login --debug
```

`--workdir`는 Supabase 프로젝트 디렉터리를 지정하고, `--yes`는 프롬프트를 자동 승인하며, `--output`은 상태 출력 형식을 지정합니다. CLI가 없는 환경에서는 먼저 Supabase CLI를 설치한 뒤 위 명령을 실행하세요.
