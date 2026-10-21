module Receipts
  # Documento de recibo em linhas. O mesmo layout é convertido para:
  #   - bytes ESC/POS (impressora térmica)
  #   - texto puro (prévia na tela)
  class Document
    # Comandos ESC/POS usados
    ESC = "\x1B".b
    GS = "\x1D".b

    INITIALIZE = "#{ESC}@".b
    ALIGN = { left: "#{ESC}a\x00".b, center: "#{ESC}a\x01".b, right: "#{ESC}a\x02".b }.freeze
    BOLD_ON = "#{ESC}E\x01".b
    BOLD_OFF = "#{ESC}E\x00".b
    # GS ! n -> 0x00 normal | 0x01 altura dupla | 0x11 largura e altura duplas
    SIZE = { normal: "#{GS}!\x00".b, tall: "#{GS}!\x01".b, double: "#{GS}!\x11".b }.freeze
    FEED_AND_CUT = "#{ESC}d\x04#{GS}V\x42\x00".b # avança 4 linhas e corta (parcial)

    # Tabelas de caracteres (ESC t n)
    CODE_PAGES = {
      "cp850" => { ruby: "IBM850", escpos: 2 },
      "cp860" => { ruby: "IBM860", escpos: 3 }
    }.freeze

    Line = Struct.new(:text, :align, :bold, :size, keyword_init: true)

    attr_reader :columns, :lines

    def initialize(columns: 48)
      @columns = columns
      @lines = []
    end

    # Texto que quebra em várias linhas se não couber
    def text(value, align: :left, bold: false, size: :normal)
      wrap(value.to_s, width_for(size)).each do |chunk|
        @lines << Line.new(text: chunk, align: align, bold: bold, size: size)
      end
      self
    end

    # Texto à esquerda e valor alinhado à direita na mesma linha
    def pair(left, right, bold: false, size: :normal)
      width = width_for(size)
      right = right.to_s
      left_width = width - right.length - 1

      left = left.to_s
      left_lines =
        if left.length <= left_width || !left_width.positive?
          [left]
        else
          wrap(left, left_width)
        end
      left_lines[0...-1].each do |chunk|
        @lines << Line.new(text: chunk, align: :left, bold: bold, size: size)
      end

      last = left_lines.last.to_s
      spaces = [width - last.length - right.length, 1].max
      @lines << Line.new(text: "#{last}#{' ' * spaces}#{right}", align: :left, bold: bold, size: size)
      self
    end

    def separator(char = "-")
      @lines << Line.new(text: char * columns, align: :left, bold: false, size: :normal)
      self
    end

    def blank
      @lines << Line.new(text: "", align: :left, bold: false, size: :normal)
      self
    end

    # Prévia em texto, do jeito que sai no papel
    def to_text
      @lines.map do |line|
        width = width_for(line.size)
        content =
          case line.align
          when :center then line.text.center(width).rstrip
          when :right then line.text.rjust(width)
          else line.text
          end

        # Na prévia, letras de largura dupla ocupam o espaço de duas
        line.size == :double ? content.chars.join(" ") : content
      end.join("\n")
    end

    # Bytes ESC/POS prontos para enviar à impressora
    def to_escpos(encoding: "cp850")
      code_page = CODE_PAGES[encoding.to_s.downcase]
      out = INITIALIZE.dup
      out << "#{ESC}t".b << code_page[:escpos].chr.b if code_page

      @lines.each do |line|
        out << ALIGN.fetch(line.align, ALIGN[:left])
        out << (line.bold ? BOLD_ON : BOLD_OFF)
        out << SIZE.fetch(line.size, SIZE[:normal])
        out << encode(line.text, code_page) << "\n".b
      end

      out << ALIGN[:left] << BOLD_OFF << SIZE[:normal]
      out << FEED_AND_CUT
      out
    end

    private

    def width_for(size)
      size == :double ? columns / 2 : columns
    end

    def encode(value, code_page)
      if code_page
        value.encode(code_page[:ruby], invalid: :replace, undef: :replace, replace: "?").b
      else
        # Sem tabela de acentos: remove os acentos (ç -> c, ã -> a)
        value.unicode_normalize(:nfd).gsub(/\p{Mn}/, "")
             .encode("ASCII", invalid: :replace, undef: :replace, replace: "?").b
      end
    end

    # Quebra por palavras; palavras maiores que a largura são cortadas
    def wrap(value, width)
      return [""] if value.empty?

      value.split("\n").flat_map do |paragraph|
        words = paragraph.split(" ")
        next [""] if words.empty?

        lines = [+""]
        words.each do |word|
          while word.length > width
            lines << +"" unless lines.last.empty?
            lines[-1] = word[0, width]
            word = word[width..]
            lines << +""
          end

          candidate = lines.last.empty? ? word : "#{lines.last} #{word}"
          if candidate.length <= width
            lines[-1] = candidate
          else
            lines << word.dup
          end
        end
        filled = lines.reject(&:empty?)
        filled.empty? ? [""] : filled
      end
    end
  end
end

