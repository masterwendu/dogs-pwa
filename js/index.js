toastr.options = {
  "closeButton": true,
  "debug": false,
  "newestOnTop": false,
  "progressBar": true,
  "positionClass": "toast-bottom-center",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
}

const onReady = () => {
  console.log('ready')
  toastr.info('You can now use the dog app offline.', 'Offline ready')
}

const handleMessage = ({ data }) => {
  if (data === 'offline') {
    document.getElementById('randomDogImage').removeAttribute('class')
    document.getElementById('randomDogImageLoading').setAttribute('class', 'hidden')
  } else if (typeof data === 'object' && data.message) {
    document.getElementById('randomDogImage').setAttribute('src', data.message)
    document.getElementById('randomDogImage').removeAttribute('class')
    document.getElementById('randomDogImageLoading').setAttribute('class', 'hidden')
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    navigator.serviceWorker.ready.then(onReady)

    navigator.serviceWorker.addEventListener('message', handleMessage)

    try {
      const registration = await navigator.serviceWorker.register('/serviceWorker.js')
      registration.addEventListener('message', handleMessage)
    } catch (error) {
      toastr.error('Offline mode not available :(', 'Error offline mode')
      console.log('ServiceWorker registration failed: ', error)
    }
  })
}

function loadRandomDog() {
  document.getElementById('randomDogImage').setAttribute('class', 'gray')
  document.getElementById('randomDogImageLoading').removeAttribute('class')
  fetch('https://dog.ceo/api/breeds/image/random').then(async (response) => {
      const json = await response.json()

      const { message: src, cached } = json
      document.getElementById('randomDogImage').setAttribute('src', src)
      if (!cached) {
        document.getElementById('randomDogImage').removeAttribute('class')
        document.getElementById('randomDogImageLoading').setAttribute('class', 'hidden')
      }
  })
}