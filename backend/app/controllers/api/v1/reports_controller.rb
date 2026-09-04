require "caxlsx"

class Api::V1::ReportsController < ApplicationController
  before_action :require_admin!

  # GET /api/v1/reports
  def index
    sales = filtered_sales

    total_sales = sales.count
    total_revenue = sales.sum(:total_amount).to_f
    total_points_generated = sales.sum(:points_earned)

    average_ticket =
      if total_sales.positive?
        total_revenue / total_sales
      else
        0
      end

    customers_count = sales.distinct.count(:customer_id)
    highest_sale = sales.maximum(:total_amount).to_f

    average_points_per_sale =
      if total_sales.positive?
        total_points_generated.to_f / total_sales
      else
        0
      end

    render json: {
      filters_applied: {
        start_date: params[:start_date],
        end_date: params[:end_date],
        customer_id: params[:customer_id],
        user_id: params[:user_id]
      },

      summary: {
        total_sales: total_sales,
        total_revenue: total_revenue,
        average_ticket: average_ticket.round(2),
        total_points_generated: total_points_generated,
        customers_count: customers_count,
        highest_sale: highest_sale,
        average_points_per_sale: average_points_per_sale.round(2)
      },

      sales: sales.order(created_at: :desc).as_json(
        only: [:id, :total_amount, :points_earned, :created_at],
        include: {
          customer: { only: [:id, :name] },
          user: { only: [:id, :name] }
        }
      )
    }, status: :ok
  end

  # GET /api/v1/reports/customers
  def customers
    customers = current_store.customers

    if params[:customer_id].present?
      customers = customers.where(id: params[:customer_id])
    end

    if params[:status].present?
      customers = customers.where(status: params[:status])
    end

    sales = current_store.sales

    if params[:start_date].present?
      start_date = Date.parse(params[:start_date])

      sales = sales.where(
        "sales.created_at >= ?",
        start_date.beginning_of_day
      )
    end

    if params[:end_date].present?
      end_date = Date.parse(params[:end_date])

      sales = sales.where(
        "sales.created_at <= ?",
        end_date.end_of_day
      )
    end

    if params[:customer_id].present?
      sales = sales.where(customer_id: params[:customer_id])
    end

    total_customers = customers.count
    active_customers = customers.where(status: :active).count
    inactive_customers = customers.where(status: :inactive).count

    total_revenue = sales.sum(:total_amount).to_f
    total_sales = sales.count
    customers_with_sales = sales.distinct.count(:customer_id)

    average_ticket =
      if total_sales.positive?
        total_revenue / total_sales
      else
        0
      end

    sales_stats = sales
                  .group(:customer_id)
                  .select(
                    "customer_id",
                    "COUNT(*) AS purchase_count",
                    "SUM(total_amount) AS total_spent",
                    "MAX(created_at) AS last_purchase"
                  )

    stats_by_customer = sales_stats.index_by(&:customer_id)

    customer_data = customers.map do |customer|
      stats = stats_by_customer[customer.id]

      purchase_count = stats ? stats.purchase_count.to_i : 0
      total_spent = stats ? stats.total_spent.to_f : 0

      average_ticket_customer =
        if purchase_count.positive?
          total_spent / purchase_count
        else
          0
        end

      {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        status: customer.status,
        points_balance: customer.points_balance,
        purchase_count: purchase_count,
        total_spent: total_spent.round(2),
        average_ticket: average_ticket_customer.round(2),
        last_purchase: stats&.last_purchase
      }
    end

    customer_data.sort_by! { |customer| -customer[:total_spent] }

    render json: {
      filters_applied: {
        start_date: params[:start_date],
        end_date: params[:end_date],
        customer_id: params[:customer_id],
        status: params[:status]
      },

      summary: {
        total_customers: total_customers,
        active_customers: active_customers,
        inactive_customers: inactive_customers,
        customers_with_sales: customers_with_sales,
        total_revenue: total_revenue.round(2),
        average_ticket: average_ticket.round(2)
      },

      customers: customer_data
    }, status: :ok
  end

  # GET /api/v1/reports/export
  # Exportação de Vendas
  def export
    sales = filtered_sales.order(created_at: :desc)

    package = Axlsx::Package.new
    workbook = package.workbook

    workbook.add_worksheet(name: "Vendas") do |sheet|
      add_excel_title(sheet, "Relatório de Vendas")
      add_excel_store(sheet)
      add_excel_period(sheet)

      sheet.add_row []
      sheet.add_row [
        "ID Venda",
        "Data",
        "Cliente",
        "Colaborador",
        "Valor Total",
        "Pontos Gerados"
      ], style: excel_header_style(workbook)

      sales.each do |sale|
        sheet.add_row [
          sale.id,
          sale.created_at.strftime("%d/%m/%Y %H:%M"),
          sale.customer&.name,
          sale.user&.name,
          sale.total_amount.to_f,
          sale.points_earned
                ], style: [
          excel_center_style(workbook),          # ID Venda
          excel_center_style(workbook),          # Data
          excel_text_style(workbook),            # Cliente
          excel_text_style(workbook),            # Colaborador
          excel_currency_center_style(workbook), # Valor Total
          excel_center_style(workbook)           # Pontos Gerados
        ]
      end

      format_excel_sheet(
        sheet,
        5,
        "F",
        [12, 20, 30, 28, 18, 18]
      )
    end

    send_excel(package, "relatorio_vendas")
  end

  # GET /api/v1/reports/export_customers

  def export_customers
    customers = filtered_customers_for_export
    sales = filtered_sales_for_customers_export

    total_revenue = sales.sum(:total_amount).to_f
    total_sales = sales.count

    average_ticket =
      if total_sales.positive?
        total_revenue / total_sales
      else
        0
      end

    sales_stats = sales
                  .group(:customer_id)
                  .select(
                    "customer_id",
                    "COUNT(*) AS purchase_count",
                    "SUM(total_amount) AS total_spent",
                    "MAX(created_at) AS last_purchase"
                  )

    stats_by_customer = sales_stats.index_by(&:customer_id)

    package = Axlsx::Package.new
    workbook = package.workbook

    workbook.add_worksheet(name: "Clientes") do |sheet|
      add_excel_title(sheet, "Relatório de Clientes")
      add_excel_store(sheet)
      add_excel_period(sheet)

      sheet.add_row []

     sheet.add_row ["Resumo"], style: excel_section_style(workbook)

      sheet.add_row [
        "Total de clientes",
        customers.count
      ], style: [
        excel_summary_label_style(workbook),
        excel_summary_value_style(workbook)
      ]

      sheet.add_row [
        "Clientes ativos",
        customers.where(status: :active).count
      ], style: [
        excel_summary_label_style(workbook),
        excel_summary_value_style(workbook)
      ]

      sheet.add_row [
        "Clientes inativos",
        customers.where(status: :inactive).count
      ], style: [
        excel_summary_label_style(workbook),
        excel_summary_value_style(workbook)
      ]

      sheet.add_row [
        "Clientes compradores",
        sales.distinct.count(:customer_id)
      ], style: [
        excel_summary_label_style(workbook),
        excel_summary_value_style(workbook)
      ]

      sheet.add_row [
        "Faturamento da base",
        total_revenue
      ], style: [
        excel_summary_label_style(workbook),
        excel_currency_style(workbook)
      ]

      sheet.add_row [
        "Ticket médio",
        average_ticket
      ], style: [
        excel_summary_label_style(workbook),
        excel_currency_style(workbook)
      ]

      sheet.add_row []

      sheet.add_row [
        "Cliente",
        "E-mail",
        "Telefone",
        "Status",
        "Compras",
        "Total gasto",
        "Ticket médio",
        "Pontos",
        "Última compra"
      ], style: excel_header_style(workbook)

      customers.each do |customer|
        stats = stats_by_customer[customer.id]

        purchase_count = stats ? stats.purchase_count.to_i : 0
        total_spent = stats ? stats.total_spent.to_f : 0

        customer_average =
          if purchase_count.positive?
            total_spent / purchase_count
          else
            0
          end

        sheet.add_row [
          customer.name,
          customer.email,
          customer.phone,
          customer.status == "active" ? "Ativo" : "Inativo",
          purchase_count,
          total_spent,
          customer_average,
          customer.points_balance,
          stats&.last_purchase ? stats.last_purchase.strftime("%d/%m/%Y %H:%M") : "-"
          ], style: [
            excel_text_style(workbook),          # Cliente
            excel_text_style(workbook),          # E-mail
            excel_center_style(workbook),        # Telefone
            excel_center_style(workbook),        # Status
            excel_center_style(workbook),        # Compras
            excel_currency_center_style(workbook), # Total gasto
            excel_currency_center_style(workbook), # Ticket médio
            excel_center_style(workbook),        # Pontos
            excel_center_style(workbook)         # Última compra
          ]
      end

      format_excel_sheet(
        sheet,
        13,
        "I",
        [28, 32, 18, 14, 12, 18, 18, 14, 22]
      )
    end

    send_excel(package, "relatorio_clientes")
  end

  # GET /api/v1/reports/export_points
  # Exportação de Pontos
  def export_points
    transactions = filtered_point_transactions_for_export

    customers = current_store.customers

    if params[:customer_id].present?
      customers = customers.where(id: params[:customer_id])
    end

    total_earned = transactions
      .where(transaction_type: :earned)
      .sum(:points)

    total_redeemed = transactions
      .where(transaction_type: :redeemed)
      .sum(:points)
      .abs

    total_adjustments = transactions
      .where(transaction_type: :adjustment)
      .sum(:points)

    package = Axlsx::Package.new
    workbook = package.workbook

    workbook.add_worksheet(name: "Pontos") do |sheet|
      add_excel_title(sheet, "Relatório de Pontos")
      add_excel_store(sheet)
      add_excel_period(sheet)

      sheet.add_row []

      sheet.add_row ["Resumo"], style: excel_section_style(workbook)

      sheet.add_row [
        "Pontos ganhos",
        total_earned
      ], style: [
        excel_summary_label_style(workbook),
        excel_summary_value_style(workbook)
      ]

      sheet.add_row [
        "Pontos resgatados",
        total_redeemed
      ], style: [
        excel_summary_label_style(workbook),
        excel_summary_value_style(workbook)
      ]

      sheet.add_row [
        "Ajustes de pontos",
        total_adjustments
      ], style: [
        excel_summary_label_style(workbook),
        excel_summary_value_style(workbook)
      ]

      sheet.add_row [
        "Total de transações",
        transactions.count
      ], style: [
        excel_summary_label_style(workbook),
        excel_summary_value_style(workbook)
      ]

      sheet.add_row [
        "Clientes com movimentação",
        transactions.distinct.count(:customer_id)
      ], style: [
        excel_summary_label_style(workbook),
        excel_summary_value_style(workbook)
      ]

      sheet.add_row [
        "Saldo atual da base",
        customers.sum(:points_balance)
      ], style: [
        excel_summary_label_style(workbook),
        excel_summary_value_style(workbook)
      ]
      sheet.add_row []

      sheet.add_row [
        "ID",
        "Data",
        "Cliente",
        "Tipo",
        "Pontos",
        "Saldo após movimentação",
        "Descrição",
        "Colaborador"
      ], style: excel_header_style(workbook)

      transactions.includes(:customer, :user).each do |transaction|
        type_label =
          case transaction.transaction_type.to_s
          when "earned"
            "Ganho"
          when "redeemed"
            "Resgate"
          when "adjustment"
            "Ajuste"
          else
            transaction.transaction_type.to_s
          end

                sheet.add_row [
          transaction.id,
          transaction.created_at.strftime("%d/%m/%Y %H:%M"),
          transaction.customer&.name,
          type_label,
          transaction.points,
          transaction.balance_after,
          transaction.description,
          transaction.user&.name
        ], style: [
          excel_center_style(workbook),          # ID
          excel_center_style(workbook),          # Data
          excel_text_style(workbook),            # Cliente
          excel_center_style(workbook),          # Tipo
          excel_center_style(workbook),          # Pontos
          excel_center_style(workbook),          # Saldo
          excel_description_style(workbook),     # Descrição
          excel_text_style(workbook)              # Colaborador
        ]
      end

      format_excel_sheet(
        sheet,
        13,
        "H",
        [10, 20, 28, 16, 14, 22, 35, 28]
      )
    end

    send_excel(package, "relatorio_pontos")
  end

  # GET /api/v1/reports/export_movements
  # Exportação de Movimentações
  def export_movements
    transactions = filtered_point_transactions_for_export
                    .includes(:customer, :user, :sale)
                    .order(created_at: :desc)

    package = Axlsx::Package.new
    workbook = package.workbook

    workbook.add_worksheet(name: "Movimentações") do |sheet|
      add_excel_title(sheet, "Relatório de Movimentações")
      add_excel_store(sheet)
      add_excel_period(sheet)

      sheet.add_row []

      sheet.add_row [
        "ID",
        "Data",
        "Cliente",
        "Tipo",
        "Pontos",
        "Saldo após",
        "Venda",
        "Descrição",
        "Colaborador"
      ], style: excel_header_style(workbook)

      transactions.each do |transaction|
        type_label =
          case transaction.transaction_type.to_s
          when "earned"
            "Ganho"
          when "redeemed"
            "Resgate"
          when "adjustment"
            "Ajuste"
          else
            transaction.transaction_type.to_s
          end

        sheet.add_row [
          transaction.id,
          transaction.created_at.strftime("%d/%m/%Y %H:%M"),
          transaction.customer&.name,
          type_label,
          transaction.points,
          transaction.balance_after,
          transaction.sale&.total_amount&.to_f,
          transaction.description,
          transaction.user&.name
        ], style: [
          excel_center_style(workbook),
          excel_center_style(workbook),
          excel_center_style(workbook),
          excel_center_style(workbook),
          excel_center_style(workbook),
          excel_center_style(workbook),
          excel_currency_center_style(workbook),
          excel_description_style(workbook),
          excel_center_style(workbook)
        ]
      end

      format_excel_sheet(
        sheet,
        5,
        "I",
        [10, 20, 28, 16, 14, 18, 18, 45, 28]
      )
    end

    send_excel(package, "relatorio_movimentacoes")
  end

  # GET /api/v1/reports/points
  def points
    transactions = current_store.points_transactions

    if params[:start_date].present?
      start_date = Date.parse(params[:start_date])

      transactions = transactions.where(
        "points_transactions.created_at >= ?",
        start_date.beginning_of_day
      )
    end

    if params[:end_date].present?
      end_date = Date.parse(params[:end_date])

      transactions = transactions.where(
        "points_transactions.created_at <= ?",
        end_date.end_of_day
      )
    end

    if params[:customer_id].present?
      transactions = transactions.where(
        customer_id: params[:customer_id]
      )
    end

    if params[:transaction_type].present?
      transactions = transactions.where(
        transaction_type: params[:transaction_type]
      )
    end

    total_earned = transactions
      .where(transaction_type: :earned)
      .sum(:points)

    total_redeemed = transactions
      .where(transaction_type: :redeemed)
      .sum(:points)
      .abs

    total_adjustments = transactions
      .where(transaction_type: :adjustment)
      .sum(:points)

    total_transactions = transactions.count

    customers_with_points = transactions
      .distinct
      .count(:customer_id)

    customers = current_store.customers

    if params[:customer_id].present?
      customers = customers.where(id: params[:customer_id])
    end

    current_balance = customers.sum(:points_balance)

    points_stats = transactions
      .group(:customer_id)
      .select(
        "customer_id",
        "SUM(CASE WHEN transaction_type = 0 THEN points ELSE 0 END) AS points_earned",
        "SUM(CASE WHEN transaction_type = 1 THEN points ELSE 0 END) AS points_redeemed",
        "SUM(CASE WHEN transaction_type = 2 THEN points ELSE 0 END) AS points_adjusted",
        "MAX(created_at) AS last_transaction"
      )

    stats_by_customer = points_stats.index_by(&:customer_id)

    customer_data = customers.map do |customer|
      stats = stats_by_customer[customer.id]

      {
        id: customer.id,
        name: customer.name,
        status: customer.status,
        points_balance: customer.points_balance,
        points_earned: stats ? stats.points_earned.to_i : 0,
        points_redeemed: stats ? stats.points_redeemed.to_i.abs : 0,
        points_adjusted: stats ? stats.points_adjusted.to_i : 0,
        last_transaction: stats&.last_transaction
      }
    end

    customer_data.sort_by! { |customer| -customer[:points_balance].to_i }

    render json: {
      filters_applied: {
        start_date: params[:start_date],
        end_date: params[:end_date],
        customer_id: params[:customer_id],
        transaction_type: params[:transaction_type]
      },

      summary: {
        total_earned: total_earned,
        total_redeemed: total_redeemed,
        total_adjustments: total_adjustments,
        total_transactions: total_transactions,
        customers_with_points: customers_with_points,
        current_balance: current_balance
      },

      customers: customer_data
    }, status: :ok
  end

  # GET /api/v1/reports/movements
  def movements
    transactions = current_store.points_transactions.includes(
      :customer,
      :user,
      :sale
    )

    if params[:start_date].present?
      start_date = Date.parse(params[:start_date])

      transactions = transactions.where(
        "points_transactions.created_at >= ?",
        start_date.beginning_of_day
      )
    end

    if params[:end_date].present?
      end_date = Date.parse(params[:end_date])

      transactions = transactions.where(
        "points_transactions.created_at <= ?",
        end_date.end_of_day
      )
    end

    if params[:customer_id].present?
      transactions = transactions.where(
        customer_id: params[:customer_id]
      )
    end

    if params[:transaction_type].present?
      transactions = transactions.where(
        transaction_type: params[:transaction_type]
      )
    end

    transactions = transactions.order(created_at: :desc)

    render json: {
      summary: {
        total_movements: transactions.count,
        total_earned: transactions
          .where(transaction_type: :earned)
          .sum(:points),
        total_redeemed: transactions
          .where(transaction_type: :redeemed)
          .sum(:points)
          .abs,
        total_adjustments: transactions
          .where(transaction_type: :adjustment)
          .count
      },

      movements: transactions.map do |tx|
        {
          id: tx.id,
          type: tx.transaction_type,
          date: tx.created_at,
          customer: tx.customer&.name,
          description: tx.description,
          points: tx.points,
          balance_after: tx.balance_after,
          sale_amount: tx.sale&.total_amount&.to_f,
          user: tx.user&.name
        }
      end
    }, status: :ok
  end

  private

  def filtered_sales
    sales = current_store.sales.includes(:customer, :user)

    if params[:start_date].present?
      start_date = Date.parse(params[:start_date])

      sales = sales.where(
        "sales.created_at >= ?",
        start_date.beginning_of_day
      )
    end

    if params[:end_date].present?
      end_date = Date.parse(params[:end_date])

      sales = sales.where(
        "sales.created_at <= ?",
        end_date.end_of_day
      )
    end

    if params[:customer_id].present?
      sales = sales.where(
        customer_id: params[:customer_id]
      )
    end

    if params[:user_id].present?
      sales = sales.where(
        user_id: params[:user_id]
      )
    end

    sales
  end

  def filtered_customers_for_export
    customers = current_store.customers

    customers = customers.where(id: params[:customer_id]) if params[:customer_id].present?
    customers = customers.where(status: params[:status]) if params[:status].present?

    customers
  end

  def filtered_sales_for_customers_export
    sales = current_store.sales

    if params[:start_date].present?
      start_date = Date.parse(params[:start_date])

      sales = sales.where(
        "sales.created_at >= ?",
        start_date.beginning_of_day
      )
    end

    if params[:end_date].present?
      end_date = Date.parse(params[:end_date])

      sales = sales.where(
        "sales.created_at <= ?",
        end_date.end_of_day
      )
    end

    sales = sales.where(customer_id: params[:customer_id]) if params[:customer_id].present?

    sales
  end

  def filtered_point_transactions_for_export
    transactions = current_store.points_transactions

    if params[:start_date].present?
      start_date = Date.parse(params[:start_date])

      transactions = transactions.where(
        "points_transactions.created_at >= ?",
        start_date.beginning_of_day
      )
    end

    if params[:end_date].present?
      end_date = Date.parse(params[:end_date])

      transactions = transactions.where(
        "points_transactions.created_at <= ?",
        end_date.end_of_day
      )
    end

    if params[:customer_id].present?
      transactions = transactions.where(
        customer_id: params[:customer_id]
      )
    end

    if params[:transaction_type].present?
      transactions = transactions.where(
        transaction_type: params[:transaction_type]
      )
    end

    transactions
  end

  def add_excel_title(sheet, title)
    sheet.add_row [title], style: excel_title_style(sheet.workbook)
    sheet.merge_cells("A1:I1")
    sheet.rows[0].height = 30
  end

  def add_excel_store(sheet)
    sheet.add_row [
      "Loja",
      current_store.name
    ], style: [
      excel_info_label_style(sheet.workbook),
      excel_info_value_style(sheet.workbook)
    ]
  end

  def add_excel_period(sheet)
    period =
      if params[:start_date].present? && params[:end_date].present?
        "#{params[:start_date]} até #{params[:end_date]}"
      elsif params[:start_date].present?
        "A partir de #{params[:start_date]}"
      elsif params[:end_date].present?
        "Até #{params[:end_date]}"
      else
        "Todo o período"
      end

    sheet.add_row [
      "Período",
      period
    ], style: [
      excel_info_label_style(sheet.workbook),
      excel_info_value_style(sheet.workbook)
    ]
  end

  def excel_title_style(workbook)
    workbook.styles.add_style(
      b: true,
      sz: 18,
      fg_color: "FFFFFF",
      bg_color: "4F46E5",
      alignment: {
        horizontal: :center,
        vertical: :center
      }
    )
  end

  def excel_info_label_style(workbook)
    workbook.styles.add_style(
      b: true,
      fg_color: "334155",
      bg_color: "E2E8F0",
      alignment: {
        horizontal: :left,
        vertical: :center
      }
    )
  end

  def excel_info_value_style(workbook)
    workbook.styles.add_style(
      fg_color: "334155",
      bg_color: "F8FAFC",
      alignment: {
        horizontal: :left,
        vertical: :center
      }
    )
  end

  def excel_header_style(workbook)
    workbook.styles.add_style(
      b: true,
      sz: 10,
      fg_color: "FFFFFF",
      bg_color: "4F46E5",
      alignment: {
        horizontal: :center,
        vertical: :center
      },
      border: {
        style: :thin,
        color: "CBD5E1"
      }
    )
  end

  def excel_section_style(workbook)
    workbook.styles.add_style(
      b: true,
      sz: 10,
      fg_color: "FFFFFF",
      bg_color: "64748B",
      alignment: {
        horizontal: :left,
        vertical: :center
      }
    )
  end

  def excel_description_style(workbook)
    workbook.styles.add_style(
      alignment: {
        horizontal: :left,
        vertical: :center,
        wrap_text: true
      },
      border: {
        style: :hair,
        color: "E2E8F0"
      }
    )
  end

  def excel_currency_style(workbook)
  workbook.styles.add_style(
    format_code: 'R$ #,##0.00',
    alignment: {
      horizontal: :right,
      vertical: :center
    },
    border: {
      style: :hair,
      color: "E2E8F0"
    }
  )
end

  def excel_currency_center_style(workbook)
    workbook.styles.add_style(
      format_code: 'R$ #,##0.00',
      alignment: {
        horizontal: :center,
        vertical: :center
      },
      border: {
        style: :hair,
        color: "E2E8F0"
      }
    )
  end

def excel_number_style(workbook)
  workbook.styles.add_style(
    alignment: {
      horizontal: :center,
      vertical: :center
    },
    border: {
      style: :hair,
      color: "E2E8F0"
    }
  )
end

def excel_center_style(workbook)
  workbook.styles.add_style(
    alignment: {
      horizontal: :center,
      vertical: :center
    },
    border: {
      style: :hair,
      color: "E2E8F0"
    }
  )
end

def excel_text_style(workbook)
  workbook.styles.add_style(
    alignment: {
      horizontal: :left,
      vertical: :center
    },
    border: {
      style: :hair,
      color: "E2E8F0"
    }
  )
end

def excel_summary_label_style(workbook)
  workbook.styles.add_style(
    b: true,
    fg_color: "475569",
    bg_color: "F1F5F9",
    alignment: {
      horizontal: :left,
      vertical: :center
    }
  )
end

def excel_summary_value_style(workbook)
  workbook.styles.add_style(
    b: true,
    fg_color: "0F172A",
    bg_color: "F8FAFC",
    alignment: {
      horizontal: :right,
      vertical: :center
    }
  )
end

  def format_excel_sheet(sheet, header_row, last_column, widths)
    sheet.rows[header_row - 1].height = 28

    sheet.auto_filter = "A#{header_row}:#{last_column}#{sheet.rows.size}"

    sheet.sheet_view.show_grid_lines = false

    sheet.sheet_view.pane do |pane|
      pane.state = :frozen
      pane.y_split = header_row
    end

    sheet.column_widths(*widths)
  end

  def send_excel(package, filename)
    send_data(
      package.to_stream.read,
      filename: "#{filename}_#{Date.current}.xlsx",
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
  end
end