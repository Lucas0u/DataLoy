module Receipts
  # Monta o recibo de uma venda para o cliente.
  class SaleReceipt
    attr_reader :sale, :profile

    def initialize(sale, profile: StoreProfile.for(sale.store))
      @sale = sale
      @profile = profile
    end

    def document
      @document ||= build
    end

    def to_text
      document.to_text
    end

    def to_escpos
      document.to_escpos(encoding: profile.encoding)
    end

    # Esconde parte do CPF (LGPD): 123.456.789-00 -> ***.456.789-**
    def self.mask_cpf(cpf)
      digits = cpf.to_s.gsub(/\D/, "")
      return "Não informado" if digits.blank?
      return "*" * digits.length unless digits.length == 11

      "***.#{digits[3, 3]}.#{digits[6, 3]}-**"
    end

    # 1234.5 -> "1.234,50"
    def self.money(value)
      cents = (value.to_d * 100).round.to_i
      sign = cents.negative? ? "-" : ""
      reais, centavos = cents.abs.divmod(100)
      "#{sign}#{reais.to_s.reverse.scan(/\d{1,3}/).join('.').reverse},#{centavos.to_s.rjust(2, '0')}"
    end

    private

    def money(value)
      self.class.money(value)
    end

    def build
      doc = Document.new(columns: profile.columns)

      store_header(doc)
      sale_header(doc)
      customer_section(doc)
      items_section(doc)
      totals_section(doc)
      loyalty_section(doc)
      footer(doc)

      doc
    end

    def store_header(doc)
      doc.text(profile.trade_name, align: :center, bold: true, size: :double)
      doc.text(profile.legal_name, align: :center) if profile.legal_name.present?
      doc.text("CNPJ: #{profile.cnpj}", align: :center) if profile.cnpj.present?
      doc.text("IE: #{profile.state_registration}", align: :center) if profile.state_registration.present?
      doc.text(profile.address, align: :center) if profile.address.present?
      doc.text(profile.city, align: :center) if profile.city.present?
      doc.text("Tel: #{profile.phone}", align: :center) if profile.phone.present?
      doc.separator("=")
    end

    def sale_header(doc)
      created_at = sale.created_at.in_time_zone(profile.time_zone)

      doc.text("COMPROVANTE DE VENDA", align: :center, bold: true)
      doc.text("Não é documento fiscal", align: :center)
      doc.separator
      doc.pair("Venda ##{sale.id}", created_at.strftime("%d/%m/%Y %H:%M"))
      doc.pair("Atendente", sale.user&.name.to_s)
      doc.separator
    end

    def customer_section(doc)
      doc.text("CLIENTE", bold: true)
      doc.text("Nome: #{sale.customer.name}")
      doc.text("CPF: #{self.class.mask_cpf(sale.customer.cpf)}")
      doc.separator
    end

    def items_section(doc)
      doc.pair("ITEM", "TOTAL", bold: true)

      sale.sale_items.each do |item|
        quantity = item.quantity.to_i
        unit_price = item.unit_price.to_d

        doc.text(item.product_name)
        doc.pair("  #{quantity} x #{money(unit_price)}", money(quantity * unit_price))
      end

      doc.separator
    end

    def totals_section(doc)
      discount = sale.discount_amount.to_d

      doc.pair("Subtotal", money(sale.total_amount))

      if discount.positive?
        coupon_code = sale.reward_redemption&.code
        label = coupon_code ? "Desconto (cupom #{coupon_code})" : "Desconto"
        doc.pair(label, "-#{money(discount)}")
      end

      doc.pair("TOTAL", "R$ #{money(sale.charged_amount)}", bold: true, size: :tall)
      doc.pair("Pagamento", sale.payment_method_label)
      doc.separator
    end

    def loyalty_section(doc)
      doc.text("PROGRAMA DE FIDELIDADE", align: :center, bold: true)
      doc.pair("Pontos nesta compra", "+#{sale.points_earned}")
      doc.pair("Saldo total de pontos", points_balance_after_sale.to_s, bold: true)

      coupons = sale.customer.reward_redemptions.usable.count
      if coupons.positive?
        doc.text(
          "Você tem #{coupons} #{coupons == 1 ? 'cupom disponível' : 'cupons disponíveis'} para a próxima compra.",
          align: :center
        )
      end

      doc.separator
    end

    def footer(doc)
      doc.text(profile.footer, align: :center) if profile.footer.present?
    end

    # Saldo do cliente logo após esta venda (vale também para reimpressões)
    def points_balance_after_sale
      transaction = sale.points_transactions.find_by(transaction_type: :earned)
      transaction ? transaction.balance_after : sale.customer.points_balance
    end
  end
end
