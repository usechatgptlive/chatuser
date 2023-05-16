import { Show, createSignal } from 'solid-js'
import type { User } from '@/types'
import type { Setter } from 'solid-js'
interface Props {
  setShowCharge: Setter<boolean>
  setUser: Setter<User>
}

export default (props: Props) => {
  let emailRef: HTMLInputElement

  const [countdown, setCountdown] = createSignal(0)
  const [url, setUrl] = createSignal('')
  let qr = ""

  const selfCharge = async() => {
    const response = await fetch('/api/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: localStorage.getItem('token'),
        code: emailRef.value,
      }),
    })
    const responseJson = await response.json()
    if (responseJson.code === 200) {
      alert(responseJson.data.msg)
      props.setUser(responseJson.data)
      props.setShowCharge(false)
    } else {
      alert(responseJson.message)
    }
  }

  const close = () => {
    props.setShowCharge(false)
  }
  const isMobile = () => {
      let flag = navigator.userAgent.match(
          /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
      );
      return flag;
  }

  const getPaycode = async(price) => {
    qr = ""
    const response = await fetch('/api/getpaycode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: localStorage.getItem('token'),
        price,
      }),
    })
    const responseJson = await response.json()
    if (responseJson.code === 200) {
      console.log(isMobile())
      if(isMobile()){
        qr = responseJson.data.qr
      }
      setUrl(responseJson.data.url)
      let flow_id = responseJson.data.flow_id
      console.log(flow_id)
      setCountdown(300)
      const intv = setInterval(() => {
        setCountdown(countdown() - 1)
        if (countdown() <= 0) {
          clearInterval(intv)
          props.setShowCharge(false)
          setUrl('')
        }
      }, 1000)

      // 检查是否到账
      const intv2 = setInterval(async() => {
        if (countdown() <= 0) {
          clearInterval(intv2)
        } else {
          const response = await fetch('/api/paynotice', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: localStorage.getItem('token'),
              flow_id:flow_id,
            }),
          })
          const responseJson = await response.json()
          if (responseJson.code === 200) {
            if (responseJson.data.msg === '充值已到账') {
              props.setUser(responseJson.data)
              alert(responseJson.data.msg)
              props.setShowCharge(false)
              setUrl('')
              clearInterval(intv2)
            }
          }
        }
      }, 3000)
    } else {
      alert(responseJson.message)
    }
  }

  return (
    <div id="input_container" class="mt-2 max-w-[450px]">
      <div>
        <Show when={!url()}>
        <a href="https://appfront0220.s3.ap-southeast-1.amazonaws.com/qmzc/2023-02-23/WechatIMG35.jpeg">如充值未到账或有使用问题,请点击联系客服</a><br/>
          <span class="text-sm">
            请选择充值金额
          </span>
          <div class="flex space-x-2">
            <button onClick={() => { getPaycode(5) }} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm">
              5元380次
            </button>
            <button onClick={() => { getPaycode(10) }} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm">
              10元820次
            </button>
            <button onClick={() => { getPaycode(20) }} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm">
              20元2200次
            </button>
          </div>
        </Show>
        <Show when={url()}>
          <span class="text-sm">
            请在{countdown()}秒内完成支付
          </span>
          <img class="w-1/3 mt-2" src={url()} />
          <Show when={qr}>
            <div class="flex space-x-2">
              <a target="_blank" href={qr} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm">去支付
              </a>
            </div>
          </Show>
        </Show>

      </div>
      <hr class="mt-4" />
      <div class="flex mt-4">
        <span class="text-sm">
          有兑换码? 请在下方输入次数兑换码
        </span>
      </div>

      <input
        ref={emailRef!}
        placeholder="请输入次数兑换码"
        type="text"
        class="gpt-password-input w-full mt-2"
        value=""
      />
      <button onClick={selfCharge} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm">
        兑换
      </button>
      <button onClick={close} class="w-1/3 h-12 mt-2 px-4 py-2 bg-slate bg-op-15 hover:bg-op-20 rounded-sm ml-2">
        关闭
      </button>
    </div>
  )
}
