require "zip"

module XlsxHelper
  def xlsx_shared_strings(body)
    result = ""
    Zip::File.open_buffer(StringIO.new(body)) do |zip|
      entry = zip.glob("xl/sharedStrings.xml").first
      result = entry.get_input_stream.read.force_encoding("UTF-8") if entry
    end
    result
  end

  def xlsx_sheet_xml(body, sheet_number = 1)
    result = ""
    Zip::File.open_buffer(StringIO.new(body)) do |zip|
      entry = zip.glob("xl/worksheets/sheet#{sheet_number}.xml").first
      result = entry.get_input_stream.read.force_encoding("UTF-8") if entry
    end
    result
  end
end

RSpec.configure do |config|
  config.include XlsxHelper, type: :request
end