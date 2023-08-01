import React, { useState } from "react"
import axios from "axios"
import { ScrapingBeeClient } from "scrapingbee"
import { Parser } from "htmlparser2"

function extractBody(html) {
  let bodyContent = ""

  const parser = new Parser({
    ontext: (text) => {
      bodyContent += text
    },
  })

  parser.write(html)
  parser.end()

  return bodyContent
}
const App = () => {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])

  const handleChange = (event) => {
    setQuery(event.target.value)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const customSearchApiKey = import.meta.env.VITE_SEARCH_API_KEY
      const customSearchEngineId = import.meta.env.VITE_SEARCHENGINE_ID
      const customSearchApiUrl = `https://www.googleapis.com/customsearch/v1?q=${query}&key=${customSearchApiKey}&cx=${customSearchEngineId}&num=1`

      const response = await axios.get(customSearchApiUrl)
      const urls = response.data.items.map((item) => item.link)

      const scrapingBeeApiKey = import.meta.env.VITE_SCRAPINGBEE_API_KEY
      //const scrapingBeeApiUrl = "https://app.scrapingbee/api/v1"

      const textPromises = urls.map(async (url) => {
        var client = new ScrapingBeeClient(scrapingBeeApiKey)
        const scrapingBeeResponse = await client.get({
          url: url,
          params: {
            api_key: scrapingBeeApiKey,
           // render_js: false,
            custom_google:true
          },
        })
        var decoder = new TextDecoder()
        var htmlRes = decoder.decode(scrapingBeeResponse.data)
        console.log(extractBody(htmlRes))
        return extractBody(htmlRes)
      })

      const textResults = await Promise.all(textPromises)
      setResults(textResults)
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen flex-col gap-4">
      <h1 className="text-center text-2xl font-bold">Web Scrapper</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="query">Enter your query:</label>
        <input
          type="text"
          id="query"
          value={query}
          onChange={handleChange}
          required
          className="outline-blue-400 ml-2 p-2 rounded-md"
        />
        <button
          type="submit"
          className="px-4 py-2 text-center bg-blue rounded-md border border-gray-200 ml-2"
        >
          Search
        </button>
      </form>
      <div className="mt-4 flex items-center gap-2">
        <ul>
          {results.map((text, index) => (
            <li key={index}>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default App
