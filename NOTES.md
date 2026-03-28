Recommended books:
(Invoke-WebRequest -Uri "https://1lib.sk/papi/book/recommended/mosaic/21/1" `
  -Method POST `
  -Headers @{"Content-Type" = "application/json"} `
  -Body '{"bookIds":[1835669]}').Content

Similar books:
https://${domain}/eapi/book/${id}/${hash}/similar

Book details:
https://${domain}/eapi/book/${id}/${hash}